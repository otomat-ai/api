import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Service } from 'typedi';
import { EntityRepository, Repository } from 'typeorm';
import { SECRET_KEY } from '@config';
import { UserEntity } from '@entities/users.entity';
import { HttpException } from '@/exceptions/httpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { ApiKey, User } from '@interfaces/users.interface';
import { ApiUserDto, CreateUserDto } from '@/dtos/users.dto';
import { generateRandom } from '@/utils/crypto';

const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const API_KEY_MAX_AGE = 60 * 60 * 24 * 365 * 10; // 10 years

const createToken = (user: User, maxAge?: number): TokenData => {
  const dataStoredInToken: DataStoredInToken = { id: user.id };
  const secretKey: string = SECRET_KEY;
  const expiresIn = maxAge || TOKEN_MAX_AGE;

  return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
}

export const createApiKey = (user: User, name?: string): ApiKey => {
  const dataStoredInToken: DataStoredInToken = { id: user.id };
  const secretKey: string = SECRET_KEY;

  return {
    name: name || generateRandom(6),
    key: sign(dataStoredInToken, secretKey, { expiresIn: API_KEY_MAX_AGE }),
    active: true
  };
}

const createCookie = (tokenData: TokenData): string => {
  return `Authorization=${tokenData.token}; Max-Age=${tokenData.expiresIn};`;
}

@Service()
@EntityRepository()
export class AuthService extends Repository<UserEntity> {
  public async signup(userData: User): Promise<User> {
    const findUser: User = await UserEntity.findOne({ where: { email: userData.email } });
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

    const hashedPassword = await hash(userData.password, 10);
    const createUserData: User = await UserEntity.create({ ...userData, password: hashedPassword }).save();

    const apiKey = createApiKey(createUserData, 'default');
    await UserEntity.update(createUserData.id, { apiKeys: { [apiKey.name]: apiKey } });

    return createUserData;
  }

  public async login({ email, password }: CreateUserDto): Promise<{ cookie: string; token: string, findUser: User }> {
    const findUser: User = await UserEntity.findOne({ where: { email } });
    if (!findUser) throw new HttpException(409, `This email ${email} was not found`);

    const isPasswordMatching: boolean = await compare(password, findUser.password);
    if (!isPasswordMatching) throw new HttpException(409, "Password not matching");

    const tokenData = createToken(findUser);
    const cookie = createCookie(tokenData);

    return { cookie, token: tokenData.token, findUser };
  }

  public async loginApi({ email, apiKey }: ApiUserDto): Promise<{ cookie: string; token: string, findUser: User }> {
    const findUser: User = await UserEntity.findOne({ where: { email } });
    if (!findUser) throw new HttpException(409, `This email ${email} was not found`);

    const isApiKeyMatching = Object.values(findUser.apiKeys).some((userKey) => userKey.key === apiKey && userKey.active);
    if (!isApiKeyMatching) throw new HttpException(409, "API key not found");

    const tokenData = createToken(findUser);
    const cookie = createCookie(tokenData);

    return { cookie, token: tokenData.token, findUser };
  }

  public async oAuthLogin({ email, sub, exp }: { email: string, sub: string, exp: number }): Promise<{ cookie: string; token: string, findUser: User }> {
    const findUser: User = await UserEntity.findOne({ where: { email, gid: sub } });
    if (!findUser) throw new HttpException(409, `This user was not found`);

    const maxAge = exp - Math.floor(Date.now() / 1000);
    console.log('#DBG#', 'TOKEN EXPIRES IN', maxAge, 'SECONDS');

    const tokenData = createToken(findUser);
    const cookie = createCookie(tokenData);

    return { cookie, token: tokenData.token, findUser };
  }

  public async logout(userData: User): Promise<User> {
    const findUser: User = await UserEntity.findOne({ where: { email: userData.email, id: userData.id } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }
}
