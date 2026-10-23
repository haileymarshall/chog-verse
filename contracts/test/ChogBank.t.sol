// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {ChogBank} from "../src/ChogBank.sol";
import {TestChog} from "../src/TestChog.sol";

contract ChogBankTest is Test {
    TestChog chog;
    ChogBank bank;
    address owner = makeAddr("owner");
    address[12] players;

    function setUp() public {
        chog = new TestChog();
        bank = new ChogBank(chog, 100 ether, owner);
        for (uint256 i; i < 12; i++) {
            players[i] = makeAddr(string(abi.encodePacked("p", vm.toString(i))));
            vm.startPrank(players[i]);
            chog.faucet();
            chog.approve(address(bank), type(uint256).max);
            bank.enter(1, i + 1);
            vm.stopPrank();
        }
    }

    function test_EntryFillsThePot() public view {
        assertEq(bank.pot(1), 1_200 ether);
        assertEq(chog.balanceOf(address(bank)), 1_200 ether);
        assertEq(bank.entrant(1, 3), players[2]);
    }

    function test_OneEntryPerChog() public {
        vm.prank(players[0]);
        vm.expectRevert(ChogBank.AlreadyEntered.selector);
        bank.enter(1, 1);
    }

    function test_SettlePaysTopThreeAndRollsOver() public {
        address[][3] memory w;
        w[0] = _crew(0);
        w[1] = _crew(4);
        w[2] = _crew(8);
        vm.prank(owner);
        bank.settle(1, w);
        // 1,200 pot: 600 / 360 / 180 split four ways, 60 rolls over
        assertEq(chog.balanceOf(players[0]), 900 ether + 150 ether);
        assertEq(chog.balanceOf(players[4]), 900 ether + 90 ether);
        assertEq(chog.balanceOf(players[8]), 900 ether + 45 ether);
        assertEq(bank.pot(2), 60 ether);
        assertTrue(bank.settled(1));
    }

    function test_EmptyPlaceRollsOver() public {
        address[][3] memory w;
        w[0] = _crew(0);
        vm.prank(owner);
        bank.settle(1, w);
        assertEq(bank.pot(2), 600 ether);
    }

    function test_OnlyOwnerSettlesOnce() public {
        address[][3] memory w;
        vm.prank(players[0]);
        vm.expectRevert();
        bank.settle(1, w);
        vm.startPrank(owner);
        bank.settle(1, w);
        vm.expectRevert(ChogBank.SeasonSettled.selector);
        bank.settle(1, w);
        vm.stopPrank();
    }

    function test_NoEntryAfterSettle() public {
        address[][3] memory w;
        vm.prank(owner);
        bank.settle(1, w);
        vm.prank(players[0]);
        vm.expectRevert(ChogBank.SeasonSettled.selector);
        bank.enter(1, 99);
    }

    function test_FaucetCooldown() public {
        vm.prank(players[0]);
        vm.expectRevert();
        chog.faucet();
        vm.warp(block.timestamp + 1 hours);
        vm.prank(players[0]);
        chog.faucet();
    }

    function _crew(uint256 from) internal view returns (address[] memory c) {
        c = new address[](4);
        for (uint256 i; i < 4; i++) c[i] = players[from + i];
    }
}
