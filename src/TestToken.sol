//SPDX-License-Identifier:MIT

pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("TestToken", "TTK") {}

    /**
     *
     * @param _receiver Address of the receiver
     * @param _amount Amount of the token to be minted.
     *
     * No Access Control required for this test token.
     */
    function mint(address _receiver, uint256 _amount) external returns (bool) {
        _mint(_receiver, _amount);
        return true;
    }
}
