const config = require('./config.json');
const Web3 = require('web3');

// Connect to your Ethereum node
const web3 = new Web3('https://rpc.sepolia.org');


// get ETH Balance
exports.getBalance = async (req, res) => {
    try {
        let address = req.params.address;

        // check for the validation
        if (!web3.utils.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        const testToken = new web3.eth.Contract(config.tokenABI, config.tokenAddress);
        const balance = await testToken.methods.balanceOf(address).call();


        res.json({ address, balance: balance.toString() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

