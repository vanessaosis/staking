import './App.css';
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { useEffect, useState } from 'react'
import 'sf-font';
import axios from 'axios';
import VAULTABI from './VAULTABI.json';
import { NFTCONTRACT, STAKINGCONTRACT, moralisapi, nftpng } from './config';
import Web3Modal from "web3modal";
// import WalletConnectProvider from "@walletconnect/web3-provider";
// import WalletLink from "walletlink";
import Web3 from "web3";

var web3 = null;
var account = null;
var vaultcontract = null;
var provider = null;

const moralisapikey = "rmo6dN3ukVlyFvERnzAQkjxYW3DQUO4dZIkLgQKvPKdCZ8ZQ3gAzdcnhbT3L5WGI";
const providerOptions = {
    // binancechainwallet: {
    //     package: true
    // },
    // walletconnect: {
    //     package: WalletConnectProvider,
    //     options: {
    //         infuraId: "e3596064a2434b66b3497af106f27886",
    //     },
    // },
    // walletlink: {
    //     package: WalletLink,
    //     options: {
    //         appName: "MBG Staking dAPP",
    //         infuraId: "e3596064a2434b66b3497af106f27886",
    //         rpc: "https://polygon-mainnet.public.blastapi.io",
    //         chainId: 137,
    //         appLogoUrl: null,
    //         darkMode: true
    //     }
    // },
};

const web3Modal = new Web3Modal({
    network: "mainnet",
    theme: "dark",
    cacheProvider: false,
    providerOptions
});

export default function NFT() {
    const [apicall, getNfts] = useState([])
    const [nftstk, getStk] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')

    useEffect(() => {
        callApi()
    }, []);

    const switchNetwork = async (chainId) => {
        if (![137, '0x89', '137'].includes(chainId)) {
            try {
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x89' }],
                });
                await callApi();
                return { msg: 'Change Network Successfull' };
            } catch (e) {
               console.log('error switchNetwork', e);
            }
        }
    }

    async function callApi() {
        provider = await web3Modal.connect();
        // provider.on('chainChanged', switchNetwork);
        web3 = new Web3(provider);
        await provider.request({ method: 'eth_requestAccounts' });
        var accounts = await web3.eth.requestAccounts();
        account = accounts[0];
        // switchNetwork(provider.chainId);
        vaultcontract = new web3.eth.Contract(VAULTABI, STAKINGCONTRACT)
        let config = { 'X-API-Key': moralisapikey, 'accept': 'application/json' };
        const nfts = await axios.get((moralisapi + `/nft/${NFTCONTRACT}/owners?chain=polygon&format=decimal`), { headers: config })
            .then(output => {
                const { result } = output.data
                return result;
            })
        const apicall = await Promise.all(nfts.map(async i => {
            let item = {
                tokenId: i.token_id,
                holder: i.owner_of,
                wallet: account,
            }
            return item
        }))
        const stakednfts = await vaultcontract.methods.tokensOfOwner(account).call()
            .then(id => {
                return id;
            })
        const nftstk = await Promise.all(stakednfts.map(async i => {
            let stkid = {
                tokenId: i,
            }
            return stkid
        }))
        getNfts(apicall)
        getStk(nftstk)
        console.log(apicall);
        console.log(nftstk)
        setLoadingState('loaded')
    }
    console.log('check', { loadingState, apicall, nftstk });
    if (loadingState === 'loaded' && !apicall.length) {
        return (<h1 className="text-3xl">Wallet Not Connected</h1>)
    }
    return (
        <div className='container mb-4 bg-black'>
            <div className="container nftportal bg-black">
                <div className="row items px-5 pt-1">
                    <div className="ml-3 mr-3 bg-black" style={{ display: "inline-grid", gridColumnEnd: "auto", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", columnGap: "10px" }}>
                        {apicall.map((nft, i) => {
                            const owner = nft.wallet.toLowerCase();
                            const holder = nft.holder.toLowerCase();
                            if (owner.indexOf(holder) !== -1) {
                                async function stakeit() {
                                    vaultcontract.methods.stake([nft.tokenId]).send({ from: account });
                                }
                                return (
                                    <div className="card nft-card mt-3 mb-3" key={i} >
                                        <div className="image-over">
                                            <img className="card-img-top" src={nftpng + nft.tokenId + '.png'} alt="" />
                                        </div>
                                        <div className="card-caption col-12 p-0">
                                            <div className="card-body">
                                                <h5 className="mb-0">OSIS MetaBadges<br></br> #{nft.tokenId}</h5>
                                                <h5 className="mb-0 mt-2">Status<p style={{ color: "#6db647", fontWeight: "bold", textShadow: "1px 1px 2px #000000" }}>Ready to Stake</p></h5>
                                                <div className="card-bottom d-flex justify-content-between">
                                                    <input key={i} type="hidden" id='stakeid' value={nft.tokenId} />
                                                    <Button style={{ marginLeft: '2px', backgroundColor: "#ffffff10" }} onClick={stakeit}>Stake it</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        })}
                        {nftstk.map((nft, i) => {
                            async function unstakeit() {
                                vaultcontract.methods.unstake([nft.tokenId]).send({ from: account });
                            }
                            return (
                                <div key={i}>
                                    <div className="card stakedcard mt-3 mb-3" >
                                        <div className="image-over">
                                            <img style={{ position: 'absolute', top: '0.05rem', width: '50px' }} src='metabadges.png'></img>
                                            <img className="card-img-top" src={nftpng + nft.tokenId + '.png'} alt="" />
                                        </div>
                                        <div className="card-caption col-12 p-0">
                                            <div className="card-body">
                                                <h5 className="mb-0">OSIS MetaBadges<br></br> #{nft.tokenId}</h5>
                                                <h5 className="mb-0 mt-2">Status<p style={{ color: "#15F4EE", fontWeight: "bold", textShadow: "1px 1px 2px #000000" }}>Currently Staked</p></h5>
                                                <div className="card-bottom d-flex justify-content-between">
                                                    <input type="hidden" id='stakeid' value={nft.tokenId} />
                                                    <Button style={{ marginLeft: '2px', backgroundColor: "#ffffff10" }} onClick={unstakeit}>Unstake it</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}