// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {ChogBank} from "../src/ChogBank.sol";
import {TestChog} from "../src/TestChog.sol";

/// forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast --private-key $DEPLOYER_KEY
contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        TestChog chog = new TestChog();
        ChogBank bank = new ChogBank(chog, 100 ether, msg.sender);
        vm.stopBroadcast();
        console.log("TestChog", address(chog));
        console.log("ChogBank", address(bank));
    }
}
