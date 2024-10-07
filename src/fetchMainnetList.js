import fs from 'fs'
import axios from 'axios'

const run = async () => {
  const tokensObject = (
    await axios.get(
      'https://raw.githubusercontent.com/alephium/token-list/refs/heads/master/tokens/mainnet.json'
    )
  ).data.tokens

  const tokensList = {}
  tokensObject.forEach(({ symbol, id, decimals, name, logoURI }) => {
    tokensList[id] = {
      symbol,
      address: id,
      decimals,
      name,
      logoURI
    }
  })

  fs.writeFileSync('./src/store/consts/tokenLists/mainnet.json', JSON.stringify(tokensList))
  console.log('Tokens list updated!')
}

run()
