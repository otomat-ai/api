import { join } from 'path';
import { ConnectionOptions } from 'typeorm';
// import { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE } from '@config';

export const developmentDbConnection: ConnectionOptions = {
  type: 'sqlite',
  database: 'dev.sqlite',
  synchronize: true,
  logging: false,
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../**/*.migration{.ts,.js}')],
  subscribers: [join(__dirname, '../**/*.subscriber{.ts,.js}')],
  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/migration',
    subscribersDir: 'src/subscriber',
  },
};

// export const productionDbConnection: ConnectionOptions = {
//   type: 'postgres',
//   database: 'd3606st5kifr1b',
//   username: 'kobdufdlffysjj',
//   password: 'fd6644f3f50e6f87b2d5365fb954291be6fbfa351f0fd71e947e73ae65fd1078',
//   host: 'ec2-52-54-200-216.compute-1.amazonaws.com',
//   port: 5432,
//   // url: 'postgres://kobdufdlffysjj:fd6644f3f50e6f87b2d5365fb954291be6fbfa351f0fd71e947e73ae65fd1078@ec2-52-54-200-216.compute-1.amazonaws.com:5432/d3606st5kifr1b',
//   synchronize: false,
//   logging: false,
//   dropSchema: false,
//   entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
//   migrations: [join(__dirname, '../**/*.migration{.ts,.js}')],
//   subscribers: [join(__dirname, '../**/*.subscriber{.ts,.js}')],
//   cli: {
//     entitiesDir: 'src/entities',
//     migrationsDir: 'src/migration',
//     subscribersDir: 'src/subscriber',
//   },
//   ssl: true,
//   extra: {
//     ssl: {
//       rejectUnauthorized: false,
//     },
//   },
// };
