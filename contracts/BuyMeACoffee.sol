// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract BuyMeACoffee {
    // Buy coffees for whom
    address payable private _recipient;

    event BuyCoffee(
        address indexed from,
        string name,
        string message,
        uint256 amount,
        uint256 timestamp
    );

    struct Memo {
        address sender;
        string name;
        string message;
        uint256 timestamp;
    }

    Memo[] private _memos;

    constructor() {
        _recipient = payable(msg.sender);
    }

    function buyCoffee(string memory name, string memory message)
        external
        payable
    {
        require(msg.value > 0, "cannot send zero amount");

        _memos.push(
            Memo({
                sender: msg.sender,
                name: name,
                message: message,
                timestamp: block.timestamp
            })
        );

        emit BuyCoffee(msg.sender, name, message, msg.value, block.timestamp);
    }

    function memos() external view returns (Memo[] memory) {
        return _memos;
    }

    function withdraw() external {
        require(address(this).balance > 0, "no balance to withdraw");

        // Withdraw the balance to the recipient
        _recipient.transfer(address(this).balance);
    }

    function recipient() public view returns (address) {
        return _recipient;
    }

    function setMyselfAsRecipient() external {
        // Should withdraw all funds to the old recipient first
        if (address(this).balance > 0) {
            _recipient.transfer(address(this).balance);
        }

        // Update the recipient
        _recipient = payable(msg.sender);
    }
}
