import { useEffect, useState } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"
import { abi, contractAddresses } from "../constants"

export default () => {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const dispatch = useNotification()
    const [entranceFee, setEntranceFee] = useState("0")
    const [numberOfPlayers, setNumberOfPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")
    const chainId = parseInt(chainIdHex)
    const lotteryAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    const {
        runContractFunction: enterLottery,
        isFetching,
        isLoading,
    } = useWeb3Contract({
        abi,
        contractAddress: lotteryAddress,
        functionName: "enterLottery",
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi,
        contractAddress: lotteryAddress,
        functionName: "getEntranceFee",
        params: {},
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi,
        contractAddress: lotteryAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi,
        contractAddress: lotteryAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    const updateUI = async () => {
        const entranceFee = (await getEntranceFee()).toString()
        const numPlayers = (await getNumberOfPlayers()).toString()
        const recentWinner = await getRecentWinner()
        setEntranceFee(entranceFee)
        setNumberOfPlayers(numPlayers)
        setRecentWinner(recentWinner)
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const onEnterLottery = async () => {
        await enterLottery({
            onSuccess: handleSuccess,
            onError: (err) => console.log(err),
        })
    }

    const handleSuccess = async (tx) => {
        const txReceipt = await tx.wait(1)
        handleNewNotification(tx)
        updateUI()
        // let winnerPicked = false
        // while (!winnerPicked) {
        //     await new Promise((resolve) => setTimeout(resolve, 500))
        //     await tx.wait(1)
        //     console.log(txReceipt.events)
        // }
    }

    const handleNewNotification = (tx) => {
        dispatch({
            type: "info",
            message: "Transaction Complete",
            title: "Tx Notification",
            position: "topR",
            icon: "bell",
        })
    }

    return (
        <div className="p-5">
            Lottery Entrance
            {lotteryAddress ? (
                <div>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded ml-auto"
                        onClick={onEnterLottery}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full" />
                        ) : (
                            "Enter Lottery"
                        )}
                    </button>
                    <div>Entrance fee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH</div>
                    <div>Number of players: {numberOfPlayers}</div>
                    <div>Recent winner: {recentWinner}</div>
                </div>
            ) : (
                <div>No Lottery address detected</div>
            )}
        </div>
    )
}
