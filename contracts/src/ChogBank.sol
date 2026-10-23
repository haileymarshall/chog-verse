// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Chog Verse Bank
/// @notice Holds the $CHOG every Chog pays to enter a season. When the season ends, the top 3 crews
///         split the vault 50/30/15. The other 5%, plus any unpaid place, rolls into next season.
/// @dev The game server computes the standings off-chain and the owner calls `settle`.
contract ChogBank is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable chog;
    uint256 public immutable entryFee;

    uint16[3] public placeBps = [5000, 3000, 1500];

    mapping(uint256 season => uint256) public pot;
    mapping(uint256 season => mapping(uint256 chogId => address)) public entrant;
    mapping(uint256 season => bool) public settled;

    event Entered(uint256 indexed season, uint256 indexed chogId, address indexed player, uint256 amount);
    event Seeded(uint256 indexed season, address indexed from, uint256 amount);
    event Paid(uint256 indexed season, uint8 place, address indexed to, uint256 amount);
    event Settled(uint256 indexed season, uint256 pot, uint256 rolledOver);

    error AlreadyEntered();
    error SeasonSettled();
    error TooManyWinners();

    constructor(IERC20 chog_, uint256 entryFee_, address owner_) Ownable(owner_) {
        chog = chog_;
        entryFee = entryFee_;
    }

    /// @notice Pay the entry fee for one Chog in a season. One entry per Chog per season.
    function enter(uint256 season, uint256 chogId) external nonReentrant {
        if (settled[season]) revert SeasonSettled();
        if (entrant[season][chogId] != address(0)) revert AlreadyEntered();
        entrant[season][chogId] = msg.sender;
        pot[season] += entryFee;
        chog.safeTransferFrom(msg.sender, address(this), entryFee);
        emit Entered(season, chogId, msg.sender, entryFee);
    }

    /// @notice Anyone can add $CHOG to a season's vault (sponsors, the team, rollover top-ups).
    function seed(uint256 season, uint256 amount) external nonReentrant {
        if (settled[season]) revert SeasonSettled();
        pot[season] += amount;
        chog.safeTransferFrom(msg.sender, address(this), amount);
        emit Seeded(season, msg.sender, amount);
    }

    /// @notice Pays the top 3 crews. `winners[i]` lists the paid-up members of the crew in place i+1.
    function settle(uint256 season, address[][3] calldata winners) external onlyOwner nonReentrant {
        if (settled[season]) revert SeasonSettled();
        settled[season] = true;
        uint256 total = pot[season];
        uint256 paid;
        for (uint8 place; place < 3; place++) {
            uint256 n = winners[place].length;
            if (n == 0) continue;
            if (n > 4) revert TooManyWinners();
            uint256 each = (total * placeBps[place]) / 10_000 / n;
            for (uint256 k; k < n; k++) {
                chog.safeTransfer(winners[place][k], each);
                emit Paid(season, place + 1, winners[place][k], each);
            }
            paid += each * n;
        }
        uint256 rest = total - paid;
        pot[season + 1] += rest;
        emit Settled(season, total, rest);
    }
}
