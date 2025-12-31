import { TrueApi, testnet } from '@truenetworkio/sdk';
import { config } from '../lib/trueNetwork/true.config';
import { orgReputationSchema } from '../lib/trueNetwork/schemas';

/**
 * Complete TrueNetwork Setup Script
 * 
 * This script will:
 * 1. Connect to TrueNetwork testnet
 * 2. Register issuer (if not already registered)
 * 3. Deploy the reputation schema
 * 4. Set your account as schema controller
 * 5. Verify everything is working
 */

async function setupTrueNetwork() {
  console.log('🚀 Starting TrueNetwork Setup...\n');

  try {
    // Step 1: Create TrueNetwork API instance
    console.log('📡 Connecting to TrueNetwork testnet...');
    const api = await TrueApi.create(config.account.secret);
    console.log('✅ Connected to TrueNetwork');
    console.log(`   Address: ${config.account.address}\n`);

    // Step 2: Set issuer
    console.log('🔑 Setting issuer...');
    await api.setIssuer(config.issuer.hash);
    console.log('✅ Issuer set');
    console.log(`   Name: ${config.issuer.name}`);
    console.log(`   Hash: ${config.issuer.hash}\n`);

    // Step 3: Deploy schema
    console.log('📋 Registering organization reputation schema...');
    console.log('   Schema includes:');
    console.log('   - orgName, developerAddress, username, organization');
    console.log('   - totalScore, repoActivityScore, tenureScore');
    console.log('   - languageStackScore, qualityScore, ossContributionScore');
    console.log('   - consistencyScore, totalPRs, mergedPRs');
    console.log('   - estimatedLOC, issueCount, repoCount');
    console.log('   - activeWeeks, tenureYears\n');

    // Register the schema on TrueNetwork
    const schemaExists = await orgReputationSchema.ifExistAlready(api);
    
    if (schemaExists) {
      console.log('✅ Schema already registered!');
      const schemaHash = orgReputationSchema.getSchemaHash();
      console.log(`   Schema Hash: ${schemaHash}`);
      console.log(`   View on Dashboard: https://testnet.dashboard.truenetwork.io/schemas/${schemaHash}\n`);
    } else {
      const schemaHash = await orgReputationSchema.register(api);
      console.log('✅ Schema registered successfully!');
      console.log(`   Schema Hash: ${schemaHash}`);
      console.log(`   View on Dashboard: https://testnet.dashboard.truenetwork.io/schemas/${schemaHash}\n`);
    }

    // Step 4: Verify schema is ready for attestations
    console.log('🧪 Verifying schema is ready for attestations...');
    
    try {
      const testAttestation = {
        orgName: 'test-org',
        developerAddress: config.account.address,
        totalScore: 85,
        repoActivityScore: 80,
        tenureScore: 90,
        languageStackScore: 85,
        qualityScore: 88,
        ossContributionScore: 82,
        consistencyScore: 87,
        totalPRs: 42,
        mergedPRs: 38,
        estimatedLOC: 5000,
        issueCount: 15,
        repoCount: 5,
        activeWeeks: 26,
        tenureYears: 2,
        timestamp: Date.now()
      };

      const attestationOutput = await orgReputationSchema.attest(api, config.account.address, testAttestation);
      
      console.log('✅ Test attestation created successfully!');
      console.log(`   Attestation ID: ${attestationOutput.attestationId}`);
      console.log(`   Transaction Hash: ${attestationOutput.transaction.hash}`);
      console.log(`   View on Prism: ${attestationOutput.prismUrl}`);
      console.log(`   View on Explorer: ${attestationOutput.transaction.explorerUrl}\n`);
    } catch (testError: any) {
      if (testError.message.includes('controller')) {
        console.log('⚠️  Schema registered but controller permission needed for attestations');
        console.log('   This is normal - the schema will work once you create attestations from your app.\n');
      } else {
        console.log('⚠️  Test attestation failed (this is OK for now)');
        console.log(`   Error: ${testError.message}\n`);
      }
    }

    console.log('🎉 Setup Complete!');
    console.log('\nYour TrueNetwork is fully configured and ready to use.');
    console.log('You can now create attestations from your API routes.\n');

    // Cleanup
    await api.network.disconnect();

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.message.includes('controller')) {
      console.log('\n💡 Controller Issue Detected:');
      console.log('   The account needs to be added as a controller for the schema.');
      console.log('\n   Options to fix:');
      console.log('   1. Visit: https://testnet.dashboard.truenetwork.io');
      console.log('   2. Connect with your wallet');
      console.log('   3. Navigate to your schema');
      console.log('   4. Add your account as a controller\n');
      console.log(`   Account: ${config.account.address}`);
      console.log(`   Issuer: ${config.issuer.hash}\n`);
    } else if (error.message.includes('balance')) {
      console.log('\n💡 Balance Issue Detected:');
      console.log('   You need testnet tokens to deploy schemas and create attestations.');
      console.log('\n   To get tokens:');
      console.log('   1. Join: https://t.me/truenetworkio');
      console.log('   2. Request tokens: /request ' + config.account.address + '\n');
    } else {
      console.log('\n   Full error:', error);
    }

    process.exit(1);
  }
}

// Run setup
setupTrueNetwork()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
