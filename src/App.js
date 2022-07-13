import './App.css';
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from 'react';
import 'sf-font';
import axios from 'axios';
import ABI from './ABI.json';
import VAULTABI from './VAULTABI.json';
import TOKENABI from './TOKENABI.json';
import { NFTCONTRACT, STAKINGCONTRACT, polygonscanapi, moralisapi } from './config';
import Web3Modal from "web3modal";
import WalletConnectProvider from '@walletconnect/web3-provider';
import WalletLink from "walletlink";
import Web3 from "web3";
import { createAlchemyWeb3 } from '@alch/alchemy-web3';

var account = null;
var contract = null;
var vaultcontract = null;
var web3 = null;

const Web3Alc = createAlchemyWeb3("https://eth-mainnet.g.alchemy.com/v2/W3CAcUSVv-z7zxqoiF3coq_6wUAXcsl8");

const moralisapikey = "rmo6dN3ukVlyFvERnzAQkjxYW3DQUO4dZIkLgQKvPKdCZ8ZQ3gAzdcnhbT3L5WGI";
const polygonscanapikey = "JAR6HQQDTVZ3UQIHCUFHJ7MV2M5E6V2FFE";

const providerOptions = {
  // binancechainwallet: {
  //   package: true
  // },
  // walletconnect: {
  //   package: WalletConnectProvider,
  //   options: {
  //     infuraId: "e3596064a2434b66b3497af106f27886"
  //   }
  // },
  // walletlink: {
  //   package: WalletLink,
  //   options: {
  //     appName: "MBG Staking dAPP",
  //     infuraId: "e3596064a2434b66b3497af106f27886",
  //     rpc: "https://polygon-mainnet.public.blastapi.io",
  //     chainId: 137,
  //     appLogoUrl: null,
  //     darkMode: true
  //   }
  // },s
};

const web3Modal = new Web3Modal({
  network: "mainnet",
  theme: "dark",
  cacheProvider: false,
  providerOptions
});

class App extends Component {
  constructor() {
    super();
    this.state = {
      balance: [],
      rawearn: [],
    };
  }

  handleModal() {
    this.setState({ show: !this.state.show })
  }

  handleNFT(nftamount) {
    this.setState({ outvalue: nftamount.target.value });
  }

  async componentDidMount() {

    await axios.get((polygonscanapi + `?module=stats&action=tokensupply&contractaddress=${NFTCONTRACT}&apikey=${polygonscanapikey}`))
      .then(outputa => {
        this.setState({
          balance: outputa.data
        })
        console.log(outputa.data)
      })
    let config = { 'X-API-Key': moralisapikey, 'accept': 'application/json' };
    await axios.get((moralisapi + `/nft/${NFTCONTRACT}/owners?chain=polygon&format=decimal`), { headers: config })
      .then(outputb => {
        const { result } = outputb.data
        this.setState({
          nftdata: result
        })
        console.log(outputb.data)
      })
  }


  render() {
    const { balance } = this.state;
    const { nftdata } = this.state;
    const { outvalue } = this.state;

    const sleep = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
    }
    const expectedBlockTime = 100000;

    async function connectwallet() {
      var provider = await web3Modal.connect();
      web3 = new Web3(provider);
      await provider.request({ method: 'eth_requestAccounts' });
      var accounts = await web3.eth.requestAccounts();
      account = accounts[0];
      document.getElementById('wallet-address').textContent = account;
      contract = new web3.eth.Contract(ABI, NFTCONTRACT);
      vaultcontract = new web3.eth.Contract(VAULTABI, STAKINGCONTRACT);
      var getstakednfts = await vaultcontract.methods.tokensOfOwner(account).call();
      document.getElementById('yournfts').textContent = getstakednfts;
      var getbalance = Number(await vaultcontract.methods.balanceOf(account).call());
      document.getElementById('stakedbalance').textContent = getbalance;
      const arraynft = Array.from(getstakednfts.map(Number));
      const tokenid = arraynft.filter(Number);
      var rwdArray = [];
      tokenid.forEach(async (id) => {
        var rawearn = await vaultcontract.methods.earningInfo(account, [id]).call();
        var array = Array.from(rawearn.map(Number));
        console.log(array);
        array.forEach(async (item) => {
          var earned = item.toPrecision(22).split('.')[0]
          var earnedrwd = Web3.utils.fromWei(earned);
          var rewardx = Number(earnedrwd).toFixed(2);
          var numrwd = Number(rewardx);
          console.log(numrwd);
          rwdArray.push(numrwd);
        });
      });
      function delay() {
        return new Promise(resolve => setTimeout(resolve, 300));
      }
      async function delayedLog(item) {
        await delay();
        var sum = item.reduce((a, b) => a + b, 0);
        var formatsum = Number(sum).toFixed(2);
        document.getElementById('earned').textContent = formatsum;
      }
      async function processArray(rwdArray) {
        for (const item of rwdArray) {
          await delayedLog(item);
        }
      }
      return processArray([rwdArray]);
    }

    async function verify() {
      var getstakednfts = await vaultcontract.methods.tokensOfOwner(account).call();
      document.getElementById('yournfts').textContent = getstakednfts;
      var getbalance = Number(await vaultcontract.methods.balanceOf(account).call());
      document.getElementById('stakedbalance').textContent = getbalance;
      console.log(getstakednfts);
    }

    async function enable() {
      contract.methods.setApprovalForAll(STAKINGCONTRACT, true).send({ from: account });
    }
    async function rewardinfo() {
      var rawnfts = await vaultcontract.methods.tokensOfOwner(account).call();
      const arraynft = Array.from(rawnfts.map(Number));
      const tokenid = arraynft.filter(Number);
      var rwdArray = [];
      tokenid.forEach(async (id) => {
        var rawearn = await vaultcontract.methods.earningInfo(account, [id]).call();
        var array = Array.from(rawearn.map(Number));
        array.forEach(async (item) => {
          var earned = item.toPrecision(22).split('.')[0];
          var earnedrwd = Web3.utils.fromWei(earned);
          var rewardx = Number(earnedrwd).toFixed(2);
          var numrwd = Number(rewardx);
          rwdArray.push(numrwd)
        });
      });
      function delay() {
        return new Promise(resolve => setTimeout(resolve, 300));
      }
      async function delayedLog(item) {
        await delay();
        var sum = item.reduce((a, b) => a + b, 0);
        var formatsum = Number(sum).toFixed(2);
        document.getElementById('earned').textContent = formatsum;
      }
      async function processArray(rwdArray) {
        for (const item of rwdArray) {
          await delayedLog(item);
        }
      }
      return processArray([rwdArray]);
    }
    async function claimit() {
      var rawnfts = await vaultcontract.methods.tokensOfOwner(account).call();
      const arraynft = Array.from(rawnfts.map(Number));
      const tokenid = arraynft.filter(Number);
      await Web3Alc.eth.getMaxPriorityFeePerGas().then((tip) => {
        Web3Alc.eth.getBlock('pending').then((block) => {
          var baseFee = Number(block.baseFeePerGas);
          var maxPriority = Number(tip);
          var maxFee = maxPriority + baseFee;
          tokenid.forEach(async (id) => {
            await vaultcontract.methods.claim([id])
              .send({
                from: account,
                maxFeePerGas: maxFee,
                maxPriorityFeePerGas: maxPriority
              })
          })
        });
      })
    }
    async function unstakeall() {
      var rawnfts = await vaultcontract.methods.tokensOfOwner(account).call();
      const arraynft = Array.from(rawnfts.map(Number));
      const tokenid = arraynft.filter(Number);
      await Web3Alc.eth.getMaxPriorityFeePerGas().then((tip) => {
        Web3Alc.eth.getBlock('pending').then((block) => {
          var baseFee = Number(block.baseFeePerGas);
          var maxPriority = Number(tip);
          var maxFee = maxPriority + baseFee;
          tokenid.forEach(async (id) => {
            await vaultcontract.methods.unstake([id])
              .send({
                from: account,
                maxFeePerGas: maxFee,
                maxPriorityFeePerGas: maxPriority
              })
          })
        });
      })
    }
    async function mintnative() {
      var _mintAmount = Number(outvalue);
      var mintRate = Number(await contract.methods.cost().call());
      var totalAmount = mintRate * _mintAmount;
      await Web3Alc.eth.getMaxPriorityFeePerGas().then((tip) => {
        Web3Alc.eth.getBlock('pending').then((block) => {
          var baseFee = Number(block.baseFeePerGas);
          var maxPriority = Number(tip);
          var maxFee = baseFee + maxPriority
          contract.methods.mint(account, _mintAmount)
            .send({
              from: account,
              value: String(totalAmount),
              maxFeePerGas: maxFee,
              maxPriorityFeePerGas: maxPriority
            });
        });
      })
    }

    async function mint0() {
      var _pid = "0";
      var erc20address = await contract.methods.getCryptotoken(_pid).call();
      var currency = new web3.eth.Contract(TOKENABI, erc20address);
      var mintRate = await contract.methods.getNFTCost(_pid).call();
      var _mintAmount = Number(outvalue);
      var totalAmount = mintRate * _mintAmount;
      await Web3Alc.eth.getMaxPriorityFeePerGas().then((tip) => {
        Web3Alc.eth.getBlock('pending').then((block) => {
          var baseFee = Number(block.baseFeePerGas);
          var maxPriority = Number(tip);
          var maxFee = maxPriority + baseFee;
          currency.methods.approve(NFTCONTRACT, String(totalAmount))
            .send({
              from: account
            })
            .then(currency.methods.transfer(NFTCONTRACT, String(totalAmount))
              .send({
                from: account,
                maxFeePerGas: maxFee,
                maxPriorityFeePerGas: maxPriority
              },
                async function (error, transactionHash) {
                  console.log("Transfer Submitted, Hash: ", transactionHash)
                  let transactionReceipt = null
                  while (transactionReceipt == null) {
                    transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash);
                    await sleep(expectedBlockTime)
                  }
                  window.console = {
                    log: function (str) {
                      var out = document.createElement("div");
                      out.appendChild(document.createTextNode(str));
                      document.getElementById("txout").appendChild(out);
                    }
                  }
                  console.log("Transfer Complete", transactionReceipt);
                  contract.methods.mintpid(account, _mintAmount, _pid)
                    .send({
                      from: account,
                      maxFeePerGas: maxFee,
                      maxPriorityFeePerGas: maxPriority
                    });
                }));
        });
      });
    }
    const refreshPage = () => {
      window.location.reload();
    }

    return (
      <div className="container py-2 bg-black">
        <div className="App nftapp bg-black">

          <nav className="container py-3 bg-black">
            <div className="container d-flex align-content-center flex-wrap bg-black"> <img src="apotheosis.png" width="" height="38" className="d-inline-block align-top" alt=""></img>
              <ul className="nav me-auto align-content-right bg-black">
                <li className="nav-item d-flex align-content-center flex-wrap"><a href="." className="nav-link link-light px-2 active" aria-current="page">Dashboard</a></li>
                <li className="nav-item d-flex align-content-center flex-wrap"><a href="#Vault" className="nav-link link-light px-2">Vault</a></li>
                <li className="nav-item d-flex align-content-center flex-wrap"><a href="#NFT" className="nav-link link-light px-2">NFTs</a></li>
                <li className="nav-item d-flex align-content-center flex-wrap"><a href="https://osis.world" target="_blank" rel="noreferrer" className="nav-link link-light px-2">OSIS</a></li>
              </ul>
              <ul className="nav">
                <li className="nav-item d-flex align-content-center flex-wrap"><a href="https://osis.world/login" target="_blank" rel="noreferrer" className="nav-link link-light px-3">GET OSIS</a></li>
                <input id="connectbtn" type="button" className="connectbutton" onClick={connectwallet} style={{ class: "nav-item d-flex align-content-center flex-wrap" }} value="Connect Your Wallet" />
                {/* <li className="nav-item d-flex align-content-center flex-wrap"><a href="https://osis.world/login" target="_blank" rel="noreferrer" className="nav-link link-light px-3">GET OSIS</a></li> */}
              </ul>
            </div>
          </nav>
          <div className='container, bg-black'>
            <div className='col, py-4'>
              <div className='nftminter'>
                <div>
                  <div className="row pt-1">
                    <div>
                      <h1 className="pt-1" style={{ fontWeight: "30", color: "#ffffff", fontFamily: "Avenir LT Std" }}>MetaBadge Staking Platform</h1>
                    </div>
                    {/* <h3>{balance.result} Minted /10000</h3> */}
                    <h6 style={{ fontWeight: "300", color: "#ffffff", fontFamily: "Avenir LT Std" }}>Your Wallet Address</h6>
                    <div className="pb-1" id='wallet-address' style={{
                      color: "#4ac0e7",
                      fontWeight: "600",
                      textShadow: "1px 1px 1px black",
                    }}>
                      <label htmlFor="floatingInput">Please Connect Your Wallet</label>
                    </div>
                  </div>
                  <div>
                    {/* <label style={{ fontWeight: "300", fontSize: "18px" }}>Select NFT Quantity</label> */}
                  </div>
                  {/* <ButtonGroup size="lg"
                    aria-label="First group"
                    name="amount"
                    style={{ boxShadow: "1px 1px 5px #4ac0e7" }}
                    onClick={nftamount => this.handleNFT(nftamount, "value")}
                  >
                    <Button value="1">1</Button>
                    <Button value="2">2</Button>
                    <Button value="3">3</Button>
                    <Button value="4">4</Button>
                    <Button value="5">5</Button>
                  </ButtonGroup> */}
                  {/* <h6 className="pt-2" style={{ fontFamily: "SF Pro Display", fontWeight: "300", fontSize: "18px" }}>Buy with your preferred crypto!</h6> */}
                  {/* <div className="row px-2 pb-2 row-style"> */}
                  {/* <div className="col "> */}
                  {/* <Button className="button-style" onClick={mint0} style={{ border: "0.2px", borderRadius: "14px", boxShadow: "1px 1px 5px #4ac0e7" }}>
                        <img src={"n2dr-logo.png"} width="100%" />
                      </Button> */}
                  {/* </div> */}
                  {/* <div className="col"> */}
                  {/* <Button className="button-style" style={{ border: "0.2px", borderRadius: "14px", boxShadow: "1px 1px 5px #4ac0e7" }}>
                        <img src="usdt.png" width="70%" />
                      </Button> */}
                  {/* </div> */}
                  {/* <div className="col"> */}
                  {/* <Button className="button-style" onClick={mintnative} style={{ border: "0.2px", borderRadius: "14px", boxShadow: "1px 1px 5px #4ac0e7" }}>
                        <img src="matic.png" width="70%" />
                      </Button> */}
                  {/* </div> */}
                  {/* <div> */}
                  {/* <div id='txout' style={{ color: "#39FF14", marginTop: "5px", fontSize: '20px', fontWeight: '500', textShadow: "1px 1px 2px #000000" }}>
                        <p style={{ fontSize: "20px" }}>Transfer Status</p>
                      </div> */}
                  {/* </div> */}
                  {/* </div> */}
                </div>
              </div>
            </div>
          </div>
          <div className='col bg-black'>
            <div className='nftstaker border-0 bg-black'>
              <div style={{ fontFamily: "Avenir LT Std" }} >
                <h2 className="pt-2" style={{ fontFamily: "Avenir LT Std", borderRadius: '14px', fontWeight: "400", color: "#ffffff", fontSize: "25px" }} id="Vault">MBG Staking Vault </h2>
                <h6 style={{ fontWeight: "300", color: "#ffffff", fontFamily: "Avenir LT Std" }}>First time staking?</h6>
                <Button className="btn" onClick={enable} style={{ backgroundColor: "#ffffff10", boxShadow: "1px 1px 5px #4ac0e7" }} >Authorize Your Wallet</Button>
                <div className="row mt-2 px-3 pt-1">
                  <div className="col-sm-4 col-center-block">
                    <div className="stakingrewards" style={{ borderRadius: "25px", boxShadow: "1px 1px 15px #4ac0e7" }}>
                      <h5 style={{ color: "#FFFFFF", fontWeight: '300', paddingTop: 15 }}>Your Vault Activity</h5>
                      <h5 style={{ color: "#FFFFFF" }}>Verify Staked Amount</h5>
                      <Button onClick={verify} style={{ backgroundColor: "#ffffff10", boxShadow: "1px 1px 5px #4ac0e7" }} >Verify</Button>
                      <table className='table mt-3 mb-5 px-3 table-dark'>
                        <tbody>
                          <tr>
                            <td style={{ fontSize: "19px", background: 'transparent' }}>Your Staked NFTs:
                              <span style={{ backgroundColor: "#ffffff00", fontSize: "21px", color: "#39FF14", fontWeight: "500", textShadow: "1px 1px 2px #000000" }} id='yournfts'></span>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "19px", background: 'transparent' }}>Total Staked NFTs:
                              <span style={{ backgroundColor: "#ffffff00", fontSize: "21px", color: "#39FF14", fontWeight: "500", textShadow: "1px 1px 2px #000000" }} id='stakedbalance'></span>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "19px", background: 'transparent' }}>Unstake All Staked NFTs<br></br>
                              <Button onClick={unstakeall} style={{ backgroundColor: "#ffffff10", boxShadow: "1px 1px 5px #4ac0e7" }} className='mb-3' >Unstake All</Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <img className="col-sm-3 col-center-block mb-5 mb-1" src="metabadges.png" />
                  <div className="col-sm-4 col-center-block">
                    <div className='stakingrewards' style={{ borderRadius: "25px", boxShadow: "1px 1px 15px #4ac0e7", fontFamily: "Avenir LT Std" }}>
                      <h5 style={{ color: "#FFFFFF", fontWeight: '300', paddingTop: 15 }}>Your Rewards Activity</h5>
                      <h5 className="" style={{ color: "#FFFFFF", fontWeight: '300' }}> Staking Rewards</h5>
                      <Button onClick={rewardinfo} style={{ backgroundColor: "#ffffff10", boxShadow: "1px 1px 5px #4ac0e7" }} >Earned MBG Rewards</Button>
                      <div id='earned' style={{ color: "#6db647", marginTop: "10px", fontSize: '25px', fontWeight: '500', textShadow: "1px 1px 2px #000000" }}><p style={{ fontSize: "20px" }}>Earned Tokens</p></div>
                      <div className='col12 mt-2'>
                        <div className="pt-2" style={{ color: 'white' }}>Claim Rewards</div>
                        <div>
                          <h1 className="pt-2" style={{ fontWeight: "30", color: "#ffffff", fontFamily: "Avenir LT Std" }}> </h1>
                        </div>
                        <Button onClick={claimit} style={{ backgroundColor: "#ffffff10", boxShadow: "1px 1px 5px #4ac0e7" }} className="mb-4">Claim</Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row px-4 pt-2">
                  <div className="header">
                    <div style={{ fontSize: '25px', borderRadius: '14px', color: "#ffffff", fontWeight: "300" }}>MBG NFT Staking Pool Active Rewards</div>
                    <h1>
                    </h1>
                    <table style={{ boxShadow: "1px 1px 15px #4ac0e7" }} className='table px-3 table-bordered table-dark' >
                      <thead className='thead-light'>
                        <tr>
                          <th scope="col">Collection</th>
                          <th scope="col">Rewards Per Day</th>
                          {/* <th scope="col">Exchangeable Items</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Standard MetaBadge</td>
                          <td className="amount" data-test-id="rewards-summary-ads">
                            <span className="amount">2000</span>&nbsp;<span className="currency">MBG</span>
                          </td>
                          {/* <td className="exchange">
                            <span className="amount">2</span>&nbsp;<span className="currency">TBD</span>
                          </td> */}
                        </tr>
                        <tr>
                          <td>Rare MetaBadge</td>
                          <td className="amount" data-test-id="rewards-summary-ac">
                            <span className="amount">2000</span>&nbsp;<span className="currency">MBG</span>
                          </td>
                          {/* <td className="exchange"><span className="amount">10</span>&nbsp;<span className="currency">TBD</span>
                          </td> */}
                        </tr>
                        <tr className='stakegoldeffect'>
                          <td>Super Rare MetaBadge</td>
                          <td className="amount" data-test-id="rewards-summary-one-time"><span className="amount">2000</span>&nbsp;<span className="currency">MBG</span>
                          </td>
                          {/* <td className="exchange">
                            <span className="amount">TBD or </span>
                            <span className="currency">TBD</span>
                          </td> */}
                        </tr>
                      </tbody>
                    </table>
                    {/* <div className="header"> */}
                    {/* <div style={{ fontSize: '25px', borderRadius: '14px', color: "#ffffff", fontWeight: '300' }}>MBG Token Stake Farms</div> */}
                    {/* <h1> */}
                    {/* </h1> */}
                    {/* <table className='table table-bordered table-dark' style={{ borderRadius: '14px', boxShadow: "1px 1px 15px #4ac0e7" }} > */}
                    {/* <thead className='thead-light'> */}
                    {/* <tr> */}
                    {/* <td>MBG Staking Farm Pools</td> */}
                    {/* <td>Harvest Daily Earnings</td> */}
                    {/* </tr> */}
                    {/* </thead> */}
                    {/* <tbody> */}
                    {/* <tr> */}
                    {/* <td>Stake MBG to Earn MBG</td> */}
                    {/* <td className="amount" data-test-id="rewards-summary-ads"> */}
                    {/* <span className="amount">0.001</span>&nbsp;<span className="currency">Per Staked MBG</span> */}
                    {/* </td> */}
                    {/* </tr> */}
                    {/* <tr>
                            <td>Stake MBG to Earn MBG+</td>
                            <td className="amount" data-test-id="rewards-summary-ac">
                              <span className="amount">0.005</span>&nbsp;<span className="currency">Per MBG</span>
                            </td>
                          </tr> */}
                    {/* </tbody> */}
                    {/* </table> */}
                    {/* </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='col mt-3 bg-black' id="NFT">
            <div className='col mt-3 ml-3 bg-black'>
              <img src="polygon.png" width={'20%'}></img>
            </div>
            <div className='col bg-black'>
              <h1 className='n2dtitlestyle mb-3 mt-3 bg-black'>Your NFT Portal</h1>
              <Button onClick={refreshPage} style={{ backgroundColor: "#000000", boxShadow: "1px 1px 15px #4ac0e7" }}>Refresh NFT Portal</Button>
            </div>
            <div className='col mt-3 mr-5 bg-black'>
              {/* <img src="./ethereum.png" width={'20%'}></img> */}
            </div>
          </div>
        </div>
      </div>
    )
  }
}
export default App;