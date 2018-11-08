import React, { Component } from 'react';
import Web3 from 'web3';
import { Modal, Navbar, Button, FormGroup, ControlLabel, FormControl, ListGroup, ListGroupItem } from 'react-bootstrap';

class App extends Component {

  web3;
  eBayClone;

  constructor(props, context) {
    super(props, context);
    this.web3 = new Web3(window.web3.currentProvider);

    const address = '0xF4c1801B5EF9D02E3CB0B91B728eF24Bfb7b77C7'; // copied from console log of 'node deploy.js' 0x...
    const abi = [{"constant":true,"inputs":[],"name":"getNumberOfProducts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"products","outputs":[{"name":"id","type":"uint256"},{"name":"seller","type":"address"},{"name":"buyer","type":"address"},{"name":"name","type":"string"},{"name":"description","type":"string"},{"name":"price","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"string"},{"name":"_description","type":"string"},{"name":"_price","type":"uint256"}],"name":"sellProduct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"uint256"}],"name":"buyProduct","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}];// copy from console log of 'node deploy.js'  [{"constant":..., "inputs":[], "name":...}];
    this.eBayClone = new this.web3.eth.Contract(abi, address);
    
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleProductDescChange = this.handleProductDescChange.bind(this);
    this.handleProductNameChange = this.handleProductNameChange.bind(this);
    this.handleProductPriceChange= this.handleProductPriceChange.bind(this);
  }

  state = {
    user:'',
    balance:'',
    show:false,
    productName: '',
    productDescription: '',
    productPrice: '',
    message: '',
    products:[]
  };

  handleProductNameChange(e) {
    this.setState({ productName: e.target.value });
  }
  handleProductDescChange(e) {
    this.setState({ productDescription: e.target.value });
  }
    
  handleProductPriceChange(e) {
    this.setState({ productPrice: e.target.value });
  }

  handleShow() {
    this.setState({
      show: true,
      productName:'',
      productPrice:'',
      productDescription:''
    });
  }

  handleClose() {
    this.setState({
      show: false
    });
  }

  handleSell = async (event) => {
    event.preventDefault();
    this.setState({message: "waiting on sell trasaction success.."});
    this.handleClose();
    await this.eBayClone.methods.sellProduct(this.state.productName,
      this.state.productDescription,
      this.web3.utils.toWei(this.state.productPrice, 'ether'))
      .send({
        from:this.state.user,
        gas:500000
      });

    await this.refreshContractDetails();
    this.setState({message: "Sell transaction entered"});
  }

  handleBuy = (_productId, _productPrice, _productSeller) => async(event) => {
    event.preventDefault();

    if(_productSeller == this.state.user) {
      this.setState({message: "You cannot buy your own product."});
      return;
    }

    this.setState({message: "waiting on buy transaction..."});
    await this.eBayClone.methods.buyProduct(_productId).send({
      from: this.state.user,
      value: this.web3.utils.toWei(_productPrice, 'ether'),
      gas: 500000 
    });

    this.setState({message: "Buy transaction entered"});
    await this.refreshContractDetails(); 
  };

  componentDidMount() {
    this.refreshContractDetails();
  }

  async refreshContractDetails() {
     const accounts = await this.web3.eth.getAccounts();
     const user = accounts[0];
     const balance = this.web3.utils.fromWei(await this.web3.eth.getBalance(user), 'ether');


     // Retrieving Products
     const productsCount = await this.eBayClone.methods.getNumberOfProducts().call();
     const products = await Promise.all(
       Array(parseInt(productsCount))
         .fill()
         .map((element, index) => {
           return this.eBayClone.methods.products(index).call();
         })
     );

     this.setState({
       user: user,
       balance: balance,
       products:products
     });
  }

  renderProducts() {
    return this.state.products.map((product, index) => {
      var price = this.web3.utils.fromWei(product.price, 'ether');
      
      return(

        <ListGroup>
          <ListGroupItem header={product.name}>Description {product.description}</ListGroupItem>
        <ListGroupItem>Price (ETH) {price}</ListGroupItem>
        <ListGroupItem>Sold by {product.seller}</ListGroupItem>
        <ListGroupItem>Bought by {product.buyer}</ListGroupItem>
        <ListGroupItem>
          <Button bsStyle="primary" onClick={this.handleBuy(product.id, price, product.seller)}>
            Buy
          </Button>
          </ListGroupItem>
        
        </ListGroup>
      );
    });
  }

  render() {
    return (
      <div className="App">
        <h1>{this.state.message}</h1>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>

              <a href="#home">eBay Clone</a>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Navbar.Text>
              Signed in as: <Navbar.Link href="#">{this.state.user}</Navbar.Link>
            </Navbar.Text>
          
            <Navbar.Text>Balance: {this.state.balance}</Navbar.Text>
            <Navbar.Text pullright>
              <Button onClick={this.handleShow}>Sell an article</Button>
            </Navbar.Text>
 
          </Navbar.Collapse>
        </Navbar>;
 
        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Sell a Product </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <form>
              <FormGroup controlId="formBasicText">
              
              <ControlLabel>Product name</ControlLabel>

              <FormControl type="text"
                           value={this.state.productName}
                           placeholder="Enter the name of your product"
                           onChange={this.handleProductNameChange} />

              <ControlLabel>"Price in ETH"</ControlLabel>
              <FormControl type="number"
                           value={this.state.productPrice}
                           placeholer="1"
                           onChange={this.handleProductPriceChange}
              />
              <ControlLabel>Description</ControlLabel>
              <FormControl type="text"
                           value={this.state.productDescription}
                           placeholder="Describe your article"
                           onChange={this.handleProductDescChange}
              />
             </FormGroup>
           </form>

          </Modal.Body>

          <Modal.Footer>
            <Button onClick={this.handleClose}>Close</Button>
            <Button onClick={this.handleSell}>Sell</Button>
          </Modal.Footer>
        </Modal>
        {this.renderProducts()}
      </div>
    );
  }
}

export default App;
