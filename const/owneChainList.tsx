import { iotex } from "@/components/wagmi/iotex";
import { FC, useState } from "react";
import { acala, ancient8, ancient8Sepolia, anvil, apexTestnet, arbitrum, arbitrumGoerli, arbitrumNova, arbitrumSepolia, areonNetwork, areonNetworkTestnet, artelaTestnet, astar, astarZkEVM, astarZkyoto, aurora, auroraTestnet, auroria, avalanche, avalancheFuji, bahamut, base, baseGoerli, baseSepolia, beam, beamTestnet, bearNetworkChainMainnet, bearNetworkChainTestnet, berachainTestnet, berachainTestnetbArtio, bevmMainnet, bitkub, bitkubTestnet, bitTorrent, bitTorrentTestnet, blast, blastSepolia, bob, boba, bronos, bronosTestnet, bsc, bscGreenfield, bscTestnet, btr, btrTestnet, bxn, bxnTestnet, canto, celo, celoAlfajores, chiliz, classic, confluxESpace, confluxESpaceTestnet, coreDao, crab, cronos, cronosTestnet, crossbell, cyber, cyberTestnet, darwinia, dchain, dchainTestnet, defichainEvm, defichainEvmTestnet, degen, dfk, dodochainTestnet, dogechain, dreyerxMainnet, edgeless, edgelessTestnet, edgeware, edgewareTestnet, ekta, ektaTestnet, eon, eos, eosTestnet, etherlink, etherlinkTestnet, evmos, evmosTestnet, fantom, fantomSonicTestnet, fantomTestnet, fibo, filecoin, filecoinCalibration, filecoinHyperspace, flare, flareTestnet, flowMainnet, flowPreviewnet, flowTestnet, foundry, fraxtal, fraxtalTestnet, funkiSepolia, fuse, fuseSparknet, gnosis, gnosisChiado, gobi, goerli, ham, haqqMainnet, haqqTestedge2, hardhat, harmonyOne, hedera, hederaPreviewnet, hederaTestnet, holesky, immutableZkEvm, immutableZkEvmTestnet, inEVM, iotexTestnet, jbc, jbcTestnet, kakarotSepolia, karura, kava, kavaTestnet, kcc, klaytn, klaytnBaobab, koi, kroma, kromaSepolia, l3x, l3xTestnet, lightlinkPegasus, lightlinkPhoenix, linea, lineaGoerli, lineaSepolia, lineaTestnet, lisk, liskSepolia, localhost, lukso, luksoTestnet, lycan, lyra, mainnet, mandala, manta, mantaSepoliaTestnet, mantaTestnet, mantle, mantleSepoliaTestnet, mantleTestnet, merlin, metachain, metachainIstanbul, metalL2, meter, meterTestnet, metis, metisGoerli, mev, mevTestnet, mintSepoliaTestnet, mode, modeTestnet, moonbaseAlpha, moonbeam, moonbeamDev, moonriver, morphHolesky, morphSepolia, nautilus, neonDevnet, neonMainnet, nexi, nexilix, oasisTestnet, oasys, okc, oortMainnetDev, opBNB, opBNBTestnet, optimism, optimismGoerli, optimismSepolia, otimDevnet, palm, palmTestnet, pgn, pgnTestnet, phoenix, playfiAlbireo, plinga, plumeTestnet, polygon, polygonAmoy, polygonMumbai, polygonZkEvm, polygonZkEvmCardona, polygonZkEvmTestnet, pulsechain, pulsechainV4, qMainnet, qTestnet, real, redbellyTestnet, redstone, reyaNetwork, rollux, rolluxTestnet, ronin, rootstock, rootstockTestnet, rss3, rss3Sepolia, saigon, sapphire, sapphireTestnet, satoshiVM, satoshiVMTestnet, scrollSepolia, sei, seiDevnet, seiTestnet, sepolia, shardeumSphinx, shibarium, shibariumTestnet, shimmer, shimmerTestnet, skaleBlockBrawlers, skaleCalypso, skaleCalypsoTestnet, skaleCryptoBlades, skaleCryptoColosseum, skaleEuropa, skaleEuropaTestnet, skaleExorde, skaleHumanProtocol, skaleNebula, skaleNebulaTestnet, skaleRazor, skaleTitan, skaleTitanTestnet, songbird, songbirdTestnet, spicy, stratis, syscoin, syscoinTestnet, taiko, taikoHekla, taikoJolnir, taikoKatla, taikoTestnetSepolia, taraxa, taraxaTestnet, telcoinTestnet, telos, telosTestnet, tenet, thaiChain, thunderTestnet, unreal, vechain, wanchain, wanchainTestnet, wemix, wemixTestnet, x1Testnet, xai, xaiTestnet, xdc, xdcTestnet, xLayer, xLayerTestnet, xrSepolia, yooldoVerse, yooldoVerseTestnet, zetachain, zetachainAthensTestnet, zhejiang, zilliqa, zilliqaTestnet, zircuitTestnet, zkFair, zkFairTestnet, zkLinkNova, zkLinkNovaSepoliaTestnet, zkSync, zkSyncInMemoryNode, zkSyncLocalNode, zkSyncSepoliaTestnet, zkSyncTestnet, zora, zoraSepolia, zoraTestnet } from "wagmi/chains";
import { coinbaseWallet, injected, metaMask } from "wagmi/connectors";

const Service: FC<{onClose: () => void, onSelectChain: (chain: { id: number, name: string }) => void }> = ({ onSelectChain, onClose }) => {
    const [hover, setHover] = useState(false);

    const [filterInput, setFilterInput] = useState<string>("");
    
const chainList = [
    acala, ancient8, ancient8Sepolia, anvil, apexTestnet, arbitrum, arbitrumGoerli, arbitrumNova,
    astar, astarZkEVM, astarZkyoto, arbitrumSepolia, areonNetwork, areonNetworkTestnet,
    artelaTestnet, aurora, auroraTestnet, auroria, avalanche, avalancheFuji, bahamut,
    base, baseGoerli, baseSepolia, beam, beamTestnet, bearNetworkChainMainnet, bearNetworkChainTestnet,
    berachainTestnet, berachainTestnetbArtio, bevmMainnet, bitkub, bitkubTestnet, bitTorrent,
    bitTorrentTestnet, blast, blastSepolia, bob, boba, bronos, bronosTestnet, bsc, bscTestnet,
    bscGreenfield, btr, btrTestnet, bxn, bxnTestnet, canto, celo, celoAlfajores, chiliz, classic,
    confluxESpace, confluxESpaceTestnet, coreDao, crab, cronos, cronosTestnet, crossbell, cyber,
    cyberTestnet, darwinia, dchain, dchainTestnet, defichainEvm, defichainEvmTestnet, degen, dfk,
    dodochainTestnet, dogechain, dreyerxMainnet, edgeless, edgelessTestnet, edgeware, edgewareTestnet,
    eon, eos, eosTestnet, etherlink, etherlinkTestnet, evmos, evmosTestnet, ekta, ektaTestnet,
    fantom, fantomSonicTestnet, fantomTestnet, fibo, filecoin, filecoinCalibration, filecoinHyperspace,
    flare, flareTestnet, flowPreviewnet, flowMainnet, flowTestnet, fraxtal, fraxtalTestnet,
    funkiSepolia, fuse, fuseSparknet, iotex, iotexTestnet, jbc, jbcTestnet, karura, gobi, goerli,
    gnosis, gnosisChiado, ham, harmonyOne, haqqMainnet, haqqTestedge2, hedera, hederaTestnet,
    hederaPreviewnet, holesky, immutableZkEvm, immutableZkEvmTestnet, inEVM, kakarotSepolia, kava,
    kavaTestnet, kcc, klaytn, klaytnBaobab, koi, kroma, kromaSepolia, l3x, l3xTestnet, lightlinkPegasus,
    lightlinkPhoenix, linea, lineaGoerli, lineaSepolia, lineaTestnet, lisk, liskSepolia, localhost,
    lukso, luksoTestnet, lycan, lyra, mainnet, mandala, manta, mantaSepoliaTestnet, mantaTestnet,
    mantle, mantleSepoliaTestnet, mantleTestnet, merlin, metachain, metachainIstanbul, metalL2,
    meter, meterTestnet, metis, metisGoerli, mev, mevTestnet, mintSepoliaTestnet, mode, modeTestnet,
    moonbaseAlpha, moonbeam, moonbeamDev, moonriver, morphHolesky, morphSepolia, nautilus, neonDevnet,
    neonMainnet, nexi, nexilix, oasys, oasisTestnet, okc, optimism, optimismGoerli, optimismSepolia,
    opBNB, opBNBTestnet, oortMainnetDev, otimDevnet, palm, palmTestnet, playfiAlbireo, pgn, pgnTestnet,
    phoenix, plinga, plumeTestnet, polygon, polygonAmoy, polygonMumbai, polygonZkEvm, polygonZkEvmCardona,
    polygonZkEvmTestnet, pulsechain, pulsechainV4, qMainnet, qTestnet, real, redbellyTestnet, redstone,
    reyaNetwork, rollux, rolluxTestnet, ronin, rootstock, rootstockTestnet, rss3, rss3Sepolia,
    sapphire, sapphireTestnet, satoshiVM, satoshiVMTestnet, scrollSepolia, sei, seiDevnet,
    seiTestnet, sepolia, shimmer, shimmerTestnet, skaleBlockBrawlers, skaleCalypso, skaleCalypsoTestnet,
    skaleCryptoBlades, skaleCryptoColosseum, skaleEuropa, skaleEuropaTestnet, skaleExorde, skaleHumanProtocol,
    skaleNebula, skaleNebulaTestnet, skaleRazor, skaleTitan, skaleTitanTestnet, songbird, songbirdTestnet,
    spicy, shardeumSphinx, shibarium, shibariumTestnet, stratis, syscoin, syscoinTestnet, taraxa,
    taiko, taikoHekla, taikoJolnir, taikoKatla, taikoTestnetSepolia, taraxaTestnet, telcoinTestnet,
    telos, telosTestnet, tenet, thaiChain, thunderTestnet, unreal, vechain, wanchain, wanchainTestnet,
    wemix, wemixTestnet, xLayerTestnet, xLayer, xai, xaiTestnet, xdc, xdcTestnet, xrSepolia,
    yooldoVerse, yooldoVerseTestnet, zetachain, zetachainAthensTestnet, zhejiang, zilliqa, zilliqaTestnet,
    zkFair, zkFairTestnet, zkLinkNova, zkLinkNovaSepoliaTestnet, zkSync, zkSyncInMemoryNode, zkSyncLocalNode,
    zkSyncSepoliaTestnet, zkSyncTestnet, zora, zoraSepolia, zircuitTestnet
];

const filteredChains = chainList.filter(
    (chain) =>
      chain.name.toLowerCase().startsWith(filterInput.toLowerCase()) ||
      chain.id.toString().startsWith(filterInput)

  );

  return (
    <div style={modalStyles}>
        <button
        
        onClick={onClose} // Calls the onClose function when clicked
      >
        &times;
      </button>
      <input
        type="text"
        value={filterInput}
        onChange={(e) => setFilterInput(e.target.value)}
        placeholder="Search by chain ID or name..."
        style={inputStyles}
      />
      <div style={listStyles}>
        {filteredChains.map((chain, index) => (
          <div
            key={index}
            onClick={() => onSelectChain(chain)}
            style={chainContainerStyles}
          >
            <p>{chain.name} (ID: {chain.id})</p>

            <p>{chain.blockExplorers?.default?.url}</p>

          </div>
        ))}
      </div>
    </div>
  );
};

// Styling for the modal to center it on the screen
const modalStyles: React.CSSProperties = {
  position: "relative", // Ensure the close button is positioned correctly
  maxWidth: "500px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "rgba(255, 255, 255, 0.04)", // Updated background color
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  transition: "background-color 0.3s ease-in-out", // Added transition
};

const closeButtonStyles: React.CSSProperties = {
  position: "absolute",
  top: "10px",
  right: "10px",
  backgroundColor: "transparent",
  border: "none",
  color: "#fff", // White color for the close button
  fontSize: "20px",
  cursor: "pointer",
  padding: "5px",
  borderRadius: "50%",
  transition: "background-color 0.3s ease-in-out",
};

// Hover effect
const closeButtonHoverStyles: React.CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.1)", // Light hover effect
};

const inputStyles: React.CSSProperties = {
  marginBottom: "20px",
  padding: "10px",
  fontSize: "16px",
  width: "100%",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const listStyles: React.CSSProperties = {
  maxHeight: "400px",
  overflowY: "auto",
};

const chainContainerStyles: React.CSSProperties = {
  border: "1px solid #333", // Darker border color
  padding: "10px",
  margin: "5px 0",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "#2c2c2c", // Darker background color
  color: "#fff", // White text color
  transition: "background-color 0.3s ease", // Smooth background color transition
};

  

export default Service;