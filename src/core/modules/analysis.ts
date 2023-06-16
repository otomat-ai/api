import { ClairModule } from "./clair";
import { PreOperatorData, PreOperatorResult } from "../operator";

export class AnalysisModule extends ClairModule {
  static async operate(props: PreOperatorData): Promise<PreOperatorResult> {
    let newResponse: any;

    if (!props.appFunction.response) newResponse = { type: 'object', properties: {}, required: [] };
    else newResponse = { ...props.appFunction.response };

    if (!newResponse.properties) newResponse.properties = {};
    newResponse.properties._analysis = {
      type: 'string',
      description: 'Your short analysis of the request and the response you generate.',
    };

    if (!newResponse.required) newResponse.required = [];
    newResponse.required.push('_analysis');

    const newAppFunctions = props.app.appFunctions.map(appFunction => {
      if (appFunction.path === props.appFunction.path) {
        return { ...appFunction, response: newResponse };
      }
      return appFunction;
    });

    return { success: true, creditCost: 0, data: { ...props, app: { ...props.app, appFunctions: newAppFunctions }, appFunction: { ...props.appFunction, response: newResponse } } };
  }
}