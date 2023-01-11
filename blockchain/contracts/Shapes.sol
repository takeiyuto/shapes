// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Shapes is ERC721URIStorage, Ownable {
    string private constant _name = "Shapes";

    constructor() ERC721(_name, "") {}

    // 発行申請を受けてからコントラクトの所有者が承認できる期間の長さをブロック数で指定する (5万ブロック = 約1週間)。
    // これをすぎると、コントラクトの所有者は何もできず、申請者がキャンセルして返金を受けることだけが可能となる。
    uint32 private constant requestExpiryBlocks = 50000;

    event MintRequested(uint256 tokenId, uint256 timestamp);

    // トークン ID に対して、発行申請された内容を保存するマッピング。
    mapping(uint256 => MintRequest) public mintRequests;
    struct MintRequest {
        address requester;
        uint32 requestBlock;
        uint24 milliEtherPaid;
        uint40 timestamp;
        string cid;
    }

    // 発行済のトークンについて、発行されたときの時刻を記録しておく変数
    uint40[1024] public tokenTimestamps;

    // トークン販売中であるか否かと価格とを保存する
    bool isSaleOpen;
    uint24 priceInMilliEther;

    // 販売を開始する。
    function openSale(uint256 _priceInMilliEther) public onlyOwner {
        require(_priceInMilliEther <= type(uint24).max, "Invalid price");
        isSaleOpen = true;
        priceInMilliEther = uint24(_priceInMilliEther);
    }

    // 販売を終了する。
    function closeSale() public onlyOwner {
        isSaleOpen = false;
        priceInMilliEther = 0;
    }

    // wei 単位で価格を取得する。もし販売中でなければエラーを返す。
    function getPrice() public view returns (uint256) {
        require(isSaleOpen, "Not on sale");
        return uint256(priceInMilliEther) * 1e15;
    }

    // 指定されたトークンが発行申請中であるかどうかを返す。
    function requested(uint256 tokenId) public view returns (bool) {
        MintRequest memory request = mintRequests[tokenId];
        return request.requester != address(0);
    }

    // 指定されたトークンが存在するかどうかを返す。
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function _setTimestampForToken(uint256 tokenId, uint40 timestamp) private {
        tokenTimestamps[tokenId] = timestamp;
    }

    function getTimestampForToken(uint256 tokenId) public view returns (uint256 timestamp) {
        timestamp = tokenTimestamps[tokenId];
        require(timestamp != 0, "No timestamp is set");
    }

    function requestMint(uint256 tokenId, uint256 timestamp, string memory _cid) external payable {
        require(!requested(tokenId), "Already requested");
        require(tokenId > 0 && tokenId <= 1024 && !_exists(tokenId), "Invalid token");
        require(msg.value >= getPrice(), "Insufficient fund");
        require(block.timestamp - 8 hours <= timestamp, "Too far in the past");
        require(timestamp <= block.timestamp, "Too far in the future");

        // 発行申請を新たに受けたら、それを記録して、サーバーが気づくようにイベントを発生させる。
        mintRequests[tokenId] = MintRequest({
            requester: _msgSender(),
            requestBlock: uint32(block.number),
            milliEtherPaid: uint24(msg.value / 1e15),
            timestamp: uint40(timestamp),
            cid: _cid
        });
        emit MintRequested(tokenId, timestamp);
    }

    // 指定された発行申請情報を取得して、記録からは削除する。
    function _fetchRequest(uint256 tokenId, bool isOwner) private returns (MintRequest memory) {
        require(requested(tokenId), "Inexistent request");

        // 発行申請から有効期限ブロックまでの間は、コントラクトの所有者だけがリクエストを承認・却下できる。
        // それを過ぎると、発行をリクエストしたユーザーだけが、申請を取り下げできる。
        MintRequest memory request = mintRequests[tokenId];
        require(
            isOwner == (block.number <= request.requestBlock + requestExpiryBlocks),
            "Invalid operation at the moment"
        );
        delete mintRequests[tokenId].cid;
        delete mintRequests[tokenId];

        return request;
    }

    // ユーザーが指定した CID にて、トークンの発行を承認する。
    function approveRequest(uint256 tokenId) public onlyOwner {
        MintRequest memory request = _fetchRequest(tokenId, true);

        // トークンを発行し、リクエストされた CID をセットする。
        _safeMint(request.requester, tokenId);
        _setTokenURI(tokenId, request.cid);
        _setTimestampForToken(tokenId, request.timestamp);
    }

    // トークンの発行を却下し、ガス代相当程度を差し引いて返金する。
    function rejectRequest(uint256 tokenId) public onlyOwner {
        MintRequest memory request = _fetchRequest(tokenId, true);

        // 0.05 ETH を手数料として引き去る (ガス代 100gwei のときのガス代程度)。
        uint256 _milliEtherPaid = uint256(request.milliEtherPaid);
        if (_milliEtherPaid > 50) {
            uint256 refund = (_milliEtherPaid - 50) * 1e15;
            payable(request.requester).transfer(refund);
        }
    }

    // 所有者が一定期間にわたって承認も却下もしなかった場合、要求をキャンセルして返金を受ける。
    function cancelRequest(uint256 tokenId) public {
        MintRequest memory request = _fetchRequest(tokenId, false);
        require(_msgSender() == request.requester, "Not your request");

        uint256 weiPaid = uint256(request.milliEtherPaid) * 1e15;
        payable(_msgSender()).transfer(weiPaid);
    }
}
