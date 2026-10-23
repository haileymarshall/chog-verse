# Chog Verse contracts

- `ChogBank.sol`: holds season entries in $CHOG and pays the top 3 crews (50/30/15). 5% rolls into next season.
- `TestChog.sol`: test $CHOG with a faucet (1,000 per hour) for Monad testnet.

```shell
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-git
forge test
```

Deployed on Monad testnet: ChogBank `0xe77Ec2184cbb338FCdB1D0C1B985c6F28FAB9C9A`, TestChog `0x6b9C05ff1dDA77454D3C5F2A0136D2BE71b2fFc9`.
