// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "arcteryx-chat-mode",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket("arc-chat-mode-bucket", {
      access: "public"
    });
    new sst.aws.Nextjs("ARcteryx-chat-mode", {
      link: [bucket],
    });
  },
});
