const path = require('path');
const fs = require('fs');
const solc = require('solc');

const eBayClonePath = path.resolve(__dirname, 'contracts', 'EBayClone.sol');

const source = fs.readFileSync(eBayClonePath, 'utf8');

module.exports = solc.compile(source, 1).contracts[':EBayClone'];  // 1 represents the number of contracts to compile


