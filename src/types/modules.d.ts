declare module "@react-email/components";
declare module "resend" {
  export class Resend {
    constructor(apiKey?: string);
    emails: {
      send(payload: any): Promise<any>;
    };
  }
}
