// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the Anchor.toml.

const anchor = require("@coral-xyz/anchor");

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Add your deployment logic here (e.g., initializing accounts after deployment)
  // const program = anchor.workspace.Medichain;
  console.log("Running basic deploy script...");
  console.log("Provider public key:", provider.wallet.publicKey.toBase58());
  // Example: Initialize something after deployment
  // try {
  //   const tx = await program.methods.initialize().rpc();
  //   console.log("Initialization transaction signature", tx);
  // } catch (err) {
  //   console.error("Initialization failed:", err);
  // }
  console.log("Deploy script finished.");
}; 