import React, {Component} from 'react';
import axios from 'axios';

import './App.css';

import {BrowserRouter as Router, Route} from "react-router-dom";
import Header from './Header/Header';
import Boards from './Boards/Boards';
import Sidebar from './Sidebar/Sidebar';
import ProductsContainer from './ProductsContainer/ProductsContainer';
import ConfirmationToast from './ConfirmationToast/ConfirmationToast';
import ProductComments from "./ProductComments/ProductComments";
import IndividualBoard from "./Boards/IndividualBoard/IndividualBoard";
import AllPins from "./AllPins/AllPins";

import { FindCookie } from "../Functions/CookieFunctions";
import { deleteComment } from "../Functions/CommentFunctions";

class App extends Component {
	constructor(props) {
		super(props);
		this.baseproductList = [];
		this.basetags = [];
		this.searchFilterParameter = '';
		this.TagFilterParameters = [];
		this.FilteredProductList = [];
		this.PriceFilterParameters = {
			'Under $25': false,
			'$25 to $50': false,
			'$50 to $100': false,
			'$100 to $200': false,
			'$200 to $500': false,
			'$500 & above': false
		};
		this.state = {
			UserData: {},
			LoginRegisterModalisOpen: false,
			ConfirmationToast: {
				ShowConfirmationToast: false,
				ToastImage: '',
				ToastAction: '',
				ToastActionDestination: ''
			},
			activeIndex: 0,
			DisplayedProductList: [],
			MeetsPriceFilters: {},
			MeetsTagFilters: [],
			adminMode: false
		};

		deleteComment = deleteComment.bind(this);
	}

	componentWillMount() {
		let t = this;
		axios.get('/api/GetAllProducts')
			.then(function (response) {
				const databaseData = response.data;

				function collectData(callback) {
					let ProjectData = [];
					for (let property1 in databaseData) {
						ProjectData.push({
							productName: databaseData[property1].name,
							productPrice: databaseData[property1].price,
							productImageAddress: databaseData[property1].productImageAddress,
							productTags: databaseData[property1].tags.split(","),
							productDescription: databaseData[property1].description,
							productID: databaseData[property1].productKey,
							productComments: databaseData[property1].comments
						});
					}
					callback(ProjectData);
				}

				collectData((ProjectData) => {
					t.findNumPoductsMatchPriceFilter(ProjectData);
					t.findNumPoductsMatchTagFilter(ProjectData);
					t.baseproductList = ProjectData;
					t.setState({DisplayedProductList: ProjectData});
				});
			});


		fetch('/api/loggedInUserReturning', {
			method: 'POST',
			body: JSON.stringify({
				token: FindCookie()
			}),
			credentials: 'include',
			headers: new Headers({
				'Content-Type': 'application/json'
			})
		}).then(res => res.json())
			.catch(error => console.log('Error: ', error))
			.then(response => {
				if (response.firstName) {
					t.setUserData({
						boards : response.boards,
						name : response.firstName,
						userId: response.email
					});
				}
			})

	}


	addNewComment = (productID, comment, name, userId, date) => {
		let ProductList = this.state.DisplayedProductList;
		const commentId = Math.random();
		ProductList.forEach(product => {
			if (product.productID === productID) {
				if (product.productComments) {
					product.productComments.push({name, userId, comment, date, commentId});
				} else {
					product.productComments = [{name, userId, comment, date, commentId}];
				}
				axios.post('/api/product_update', {
					productKey: productID,
					comments: product.productComments
				})
					.then(function (response) {
						console.log(response);
					})
					.catch(function (error) {
						console.log(error);
					})
			}
		});

		this.setState({DisplayedProductList: ProductList});
		this.displayConfirmationToast('', 'thanks for', 'your comment!');
	};

	toggleLoginRegisterModal = () => {
		this.setState({LoginRegisterModalisOpen: !this.state.LoginRegisterModalisOpen});
	};

	// deleteComment = (productID, commentId) => {
	// 	let ProductList = this.state.DisplayedProductList;
	// 	ProductList.forEach(product => {
	// 		if (product.productID === productID) {
	// 			console.log("yes");
	// 			product.productComments = product.productComments.filter((comment) => {
	// 				return comment.commentId !== commentId;
	// 			});
	// 			console.log(product.productComments);
	// 			axios.post('/api/product_update', {
	// 				productKey: productID,
	// 				comments: product.productComments
	// 			})
	// 				.then(function (response) {
	// 					console.log(response);
	// 				})
	// 				.catch(function (error) {
	// 					console.log(error);
	// 				})
	// 		}
	// 	});
	// 	this.setState({DisplayedProductList: ProductList});
	// };



	openEditCommentWindow = (productID, commentId) => {
		let ProductList = this.state.DisplayedProductList;
		ProductList.forEach(product => {
			if (product.productID === productID) {
				product.productComments.forEach((comment) => {
					if (comment.commentId === commentId) {
						comment['edit'] = true;
					}
				});
			}
		});
		this.setState({DisplayedProductList: ProductList});
	};

	editComment = (productID, commentId, newCommentText) => {
		let ProductList = this.state.DisplayedProductList;
		ProductList.forEach(product => {
			if (product.productID === productID) {
				product.productComments.forEach((comment) => {
					if (comment.commentId === commentId) {
						comment.comment = newCommentText;
						comment.edit = false;
					}
				});
				axios.post('/api/product_update', {
					productKey: productID,
					comments: product.productComments
				})
					.then(function (response) {
						console.log(response);
					})
					.catch(function (error) {
						console.log(error);
					})
			}
		});
		this.setState({DisplayedProductList: ProductList});
	};

	addPinToExistingBoard = (productName, productDescription, productImage, productID, boardID) => {
		let UserData = this.state.UserData;
		for (let board of UserData.Boards) {
			if (board.boardID === boardID) {
				if (board.pins) {
					board.pins.push({productName, productDescription, productImage, productID});
				} else {
					board.pins = [{productName, productDescription, productImage, productID}];
				}
				this.justThePins(UserData);
				this.setState({UserData});

				this.displayConfirmationToast(productImage, 'Saved to', board.name);

				axios.post('/api/board_update', {
					email: this.state.UserData.userID,
					boards: JSON.stringify(UserData.Boards)
				})
					.then(function (response) {
						console.log(response);
					})
					.catch(function (error) {
						console.log(error);
					})
			}
		}

	};

	deletePinFromBoard = (boardID, productID, productImage) => {
		let UserData = this.state.UserData;
		for (let board of UserData.Boards) {
			if (board.boardID == boardID) {
				board.pins = board.pins.filter(pin => {
					if (pin.productID !== productID) {
						return true;
					} else {
						return false;
					}
				});
			}
		}
		this.justThePins(UserData);
		this.setState({UserData});

		this.displayConfirmationToast(productImage, 'Deleted from', "board");

		axios.post('/api/board_update', {
			email: this.state.UserData.userID,
			boards: JSON.stringify(UserData.Boards)
		})
			.then(function (response) {
				console.log(response);
			})
			.catch(function (error) {
				console.log(error);
			});

	};

	addPinToNewBoard = (productName, productDescription, productImage, productID, boardName) => {
		let UserData = this.state.UserData;
		if(!UserData.Boards)  { UserData.Boards = []; }
		UserData.Boards.push({
			name: boardName,
			boardID: Math.random(),
			pic: productImage,
			pins: [{productName, productDescription, productImage, productID}]
		});
		this.justThePins(UserData);
		this.setState({UserData});
		this.displayConfirmationToast(productImage, 'Saved to', boardName);

		axios.post('/api/board_update', {
			email: this.state.UserData.userID,
			boards: JSON.stringify(UserData.Boards)
		})
			.then(function (response) {
				console.log(response);
			})
			.catch(function (error) {
				console.log(error);
			});

	};

	createNewBoard = (boardName) => {
		let UserData = this.state.UserData;
		if(!UserData.Boards)  { UserData.Boards = []; }
		UserData.Boards.push({
			name: boardName,
			boardID: Math.random()
		});
		this.setState({UserData});
		this.displayConfirmationToast('', 'New Board Created', boardName);

		axios.post('/api/board_update', {
			email: this.state.UserData.userID,
			boards: JSON.stringify(UserData.Boards)
		})
			.then(function (response) {
				console.log(response);
			})
			.catch(function (error) {
				console.log(error);
			})
	};

	editBoard = (boardID, newBoardName, newBoardDescription) => {
		let UserData = this.state.UserData;
		UserData.Boards.forEach(board => {
			if (board.boardID === boardID) {
				if (newBoardName) {
					board.name = newBoardName;
				}
				if (newBoardDescription) {
					board.description = newBoardDescription;
				}
			}
		});
		this.setState({UserData});

		this.displayConfirmationToast('', 'Your board', 'has been updated');

		axios.post('/api/board_update', {
			email: this.state.UserData.userID,
			boards: JSON.stringify(UserData.Boards)
		})
			.then(function (response) {
				console.log(response);
			})
			.catch(function (error) {
				console.log(error);
			})
	};

	deleteBoard = (boardID) => {
		let UserData = this.state.UserData;
		let boardname;
		UserData.Boards = UserData.Boards.filter(board => {
			if (board.boardID !== boardID) {
				return true;
			} else {
				boardname = board.name;
				return false;
			}
		});
		this.justThePins(UserData);
		this.setState({UserData});

		this.displayConfirmationToast('', `"${boardname}" board`, 'has been deleted');

		axios.post('/api/board_update', {
			email: this.state.UserData.userID,
			boards: JSON.stringify(UserData.Boards)
		})
			.then(function (response) {
				console.log(response);
			})
			.catch(function (error) {
				console.log(error);
			});

	};

	setUserData = (userInfo) => {
		console.log(userInfo);
		let UserData = this.state.UserData;
		if (userInfo.boards) {
			userInfo.boards = JSON.parse(userInfo.boards);
			UserData.Boards = userInfo.boards || [];
			this.justThePins(UserData);
		}
		UserData.userID = userInfo.email;
		UserData.name = userInfo.name;

		this.setState({UserData});
	};

	removeUserData = () => {
		this.setState({UserData: {}});
	};

	displayConfirmationToast = (ToastImage, ToastAction, ToastActionDestination) => {
		this.setState({
			ConfirmationToast:
				{
					ShowConfirmationToast: true,
					ToastImage,
					ToastAction,
					ToastActionDestination
				}
		});
		setTimeout(function () {
			this.setState({ConfirmationToast: {ShowConfirmationToast: false}});
		}.bind(this), 3500);
	};


	removeProduct = (productToRemove) => {
		this.baseproductList = this.baseproductList.filter(product => {
			if (product.productID !== productToRemove) {
				return true;
			} else {
				return false;
			}
		});

		this.removeFromFavorites(productToRemove);

		this.basetags = [];
		this.setState({DisplayedProductList: this.filterProductsByTag(this.filterProductsByPrice(this.filterProductsBySearch()))});
		this.findNumPoductsMatchPriceFilter(this.FilteredProductList);
		this.findNumPoductsMatchTagFilter(this.FilteredProductList);
	};

	editProduct = (productToRemove) => {
		this.baseproductList = this.baseproductList.filter(product => {
			if (product.productID !== productToRemove) {
				return true;
			} else {
				return false;
			}
		});
	};


	updateSearchParameter = (searchParameter) => {
		this.searchFilterParameter = searchParameter;
		this.setState({DisplayedProductList: this.filterProductsByTag(this.filterProductsByPrice(this.filterProductsBySearch()))});
		this.findNumPoductsMatchPriceFilter(this.FilteredProductList);
		this.findNumPoductsMatchTagFilter(this.FilteredProductList);
	};

	updatePriceFilter = (filter) => {
		this.PriceFilterParameters = {
			...this.PriceFilterParameters,
			[filter]: !this.PriceFilterParameters[filter]
		};
		this.setState({DisplayedProductList: this.filterProductsByTag(this.filterProductsByPrice(this.filterProductsBySearch()))});
		this.findNumPoductsMatchTagFilter(this.FilteredProductList);
		if (this.FilteredProductList.length === this.baseproductList.length) {
			this.findNumPoductsMatchPriceFilter(this.FilteredProductList);
		}
	};

	updateTagFilter = (filter) => {
		let filterAdded = false;
		if (this.TagFilterParameters.length < 1) {
			this.TagFilterParameters.push([filter, true]);
		} else {
			for (let e = 0; e < this.TagFilterParameters.length; e++) {
				if (this.TagFilterParameters[e][0] === filter) {
					this.TagFilterParameters[e] = [filter, !this.TagFilterParameters[e][1]];
					filterAdded = true;
					break;
				}
			}
			if (!filterAdded) {
				this.TagFilterParameters.push([filter, true]);
			}
		}

		this.setState({DisplayedProductList: this.filterProductsByTag(this.filterProductsByPrice(this.filterProductsBySearch()))});
		this.findNumPoductsMatchPriceFilter(this.FilteredProductList);
		if (this.FilteredProductList.length === this.baseproductList.length) {
			this.findNumPoductsMatchTagFilter(this.FilteredProductList);
		}
	};


	filterProductsByPrice = (editedproductList) => {
		let alwaysReturnTrue = false;
		let params = this.PriceFilterParameters;
		if (!params['Under $25'] && !params['$25 to $50'] && !params['$50 to $100'] && !params['$100 to $200'] && !params['$200 to $500'] && !params['$500 & above']) {
			alwaysReturnTrue = true;
		} else {
			alwaysReturnTrue = false;
		}
		return editedproductList.filter(product => {
			if (alwaysReturnTrue) {
				return true;
			}
			if (params['Under $25']) {
				if (product.productPrice < 25) {
					return true;
				}
			}
			if (params['$25 to $50']) {
				if (25 < product.productPrice && product.productPrice < 50) {
					return true;
				}
			}
			if (params['$50 to $100']) {
				if (50 < product.productPrice && product.productPrice < 100) {
					return true;
				}
			}
			if (params['$100 to $200']) {
				if (100 < product.productPrice && product.productPrice < 200) {
					return true;
				}
			}
			if (params['$200 to $500']) {
				if (200 < product.productPrice && product.productPrice < 500) {
					return true;
				}
			}
			if (params['$500 & above']) {
				if (500 < product.productPrice) {
					return true;
				}
			}
			return false;
		});
	};


	filterProductsBySearch = () => {
		return this.baseproductList.filter(product => {
			if (product.productName.search(this.searchFilterParameter) > -1) {
				return true;
			} else if (product.productDescription.search(this.searchFilterParameter) > -1) {
				return true;
			} else {
				return false;
			}
		});
	};

	filterProductsByTag = (editedproductList) => {
		let alwaysReturnTrue = false;
		let params = this.TagFilterParameters;
		if (params.length === 0) {
			alwaysReturnTrue = true;
		} else if (params.every(tag => tag[1] === false)) {
			alwaysReturnTrue = true;
		} else {
			alwaysReturnTrue = false;
		}
		let FilteredProductList = editedproductList.filter(product => {
			if (alwaysReturnTrue) {
				return true;
			}
			for (let e = 0; e < params.length; e++) {

				if (params[e][1] && (product.productTags.find(tag => tag === params[e][0]))) {
					return true;
				}
			}
			return false;
		});
		this.FilteredProductList = FilteredProductList;
		return FilteredProductList;
	};


	findNumPoductsMatchPriceFilter = (FilteredProductList) => {
		let priceUnder25 = 0, price25to50 = 0, price50to100 = 0, price100to200 = 0, price200to500 = 0, priceOver500 = 0;
		for (let product of FilteredProductList) {
			if (product.productPrice < 25) {
				priceUnder25++;
			}
			if (25 < product.productPrice && product.productPrice < 50) {
				price25to50++;
			}
			if (50 < product.productPrice && product.productPrice < 100) {
				price50to100++;
			}
			if (100 < product.productPrice && product.productPrice < 200) {
				price100to200++;
			}
			if (200 < product.productPrice && product.productPrice < 500) {
				price200to500++;
			}
			if (500 < product.productPrice) {
				priceOver500++;
			}
		}
		this.setState({
			MeetsPriceFilters: {
				priceUnder25,
				price25to50,
				price50to100,
				price100to200,
				price200to500,
				priceOver500
			}
		})
	};

	findNumPoductsMatchTagFilter = (FilteredProductList) => {
		let tagsCount;
		if (this.basetags.length > 0) {
			tagsCount = this.basetags;
			tagsCount.forEach(element => element[1] = 0);
		} else {
			tagsCount = [];
		}
		for (let product of FilteredProductList) {
			for (let tag of product.productTags) {
				let index = tagsCount.findIndex(element => (element[0] === tag));
				if (index > -1) {
					tagsCount[index][1]++;
				} else {
					tagsCount.push([tag, 1]);
				}
			}
		}
		this.basetags = tagsCount;
		this.setState({MeetsTagFilters: tagsCount});
	};

	addNewContent = () => {
		this.baseproductList.unshift({
			productImageAddress: '',
			productName: '',
			productPrice: '',
			productDescription: '',
			productTags: [],
			productID: Math.random()
		});
		this.setState({DisplayedProductList: this.baseproductList});
	};

	submitNewProductInfo = (productID, newTags, newImgSrc, newName, newPrice, newDescription) => {
		this.baseproductList.forEach(product => {
			if (product.productID === productID) {
				product.productImageAddress = newImgSrc;
				newTags.length > 0 && newTags[0] !== ""
					? product.productTags = newTags.split(',')
					: product.productTags = [];
				product.productName = newName;
				product.productPrice = newPrice;
				product.productDescription = newDescription;
			}
		});
		this.basetags = [];
		this.setState({DisplayedProductList: this.filterProductsByTag(this.filterProductsByPrice(this.filterProductsBySearch()))});
		this.findNumPoductsMatchPriceFilter(this.FilteredProductList);
		this.findNumPoductsMatchTagFilter(this.FilteredProductList);
	};

	justThePins = (UserData) => {
		let userdata = UserData;
		if (userdata.Boards) {
			let pins = [];
			userdata.Boards.forEach(board => {
				if (board.pins) {
					board.pins.forEach(pin => {
						pins.push({...pin, boardID: board.boardID});
					});
				}
			});
			userdata.pins = pins;
			this.setState({ UserData : userdata });
		}
	};


	render() {
		return (
			<Router>
				<div>
					<Route exact path="/boards/:board" render={({match}) =>
						<IndividualBoard
							boardID={match.params.board}
							boards={this.state.UserData.Boards}
							deletePinFromBoard={this.deletePinFromBoard}
						/>
					}/>
					<Route exact path="/pins" render={() =>
						<AllPins
							deletePinFromBoard={this.deletePinFromBoard}
							pins={this.state.UserData.pins}
						/>
					}/>
					<Route exact path="/boards" render={() =>
						<Boards
							Boards={this.state.UserData.Boards}
							products={this.state.DisplayedProductList}
							createNewBoard={this.createNewBoard}
							deleteBoard={this.deleteBoard}
							editBoard={this.editBoard}
						/>
					}/>

					<Route exact path="/products/:product" render={({match}) =>
						<ProductComments
							productID={match.params.product}
							productList={this.state.DisplayedProductList}
							addNewComment={this.addNewComment}
							addPinToExistingBoard={this.addPinToExistingBoard}
							addPinToNewBoard={this.addPinToNewBoard}
							boards={this.state.UserData.Boards}
							deleteComment={deleteComment}
							editComment={this.editComment}
							openEditCommentWindow={this.openEditCommentWindow}
							userData={this.state.UserData}
							toggleLoginRegisterModal={this.toggleLoginRegisterModal}
							LoginRegisterModalisOpen={this.state.LoginRegisterModalisOpen}
							setUserData={this.setUserData}
						/>}
					/>

					<Route exact path="/" render={() =>
						<Header
							filterProducts={this.updateSearchParameter}
							removeUserData={this.removeUserData}
							setUserData={this.setUserData}
							name={this.state.UserData.name}
							boards={this.state.UserData.Boards}
							pinsCount={this.state.UserData.pins}
							toggleLoginRegisterModal={this.toggleLoginRegisterModal}
							LoginRegisterModalisOpen={this.state.LoginRegisterModalisOpen}
						/>
					}/>

					<Route exact path="/" render={() =>
						<main className="homepage">
							<Sidebar
								MeetsPriceFilters={this.state.MeetsPriceFilters}
								adminMode={this.state.adminMode}

								updatePriceFilter={this.updatePriceFilter}
								updateTagFilter={this.updateTagFilter}
								addNewContent={this.addNewContent}
								MeetsTagFilters={this.basetags}
							/>

							<ProductsContainer
								products={this.state.DisplayedProductList}
								adminMode={this.state.adminMode}
								boards={this.state.UserData.Boards}

								searchString={this.searchFilterParameter}
								removeProduct={this.removeProduct}
								editProduct={this.editProduct}
								submitNewProductInfo={this.submitNewProductInfo}
								addPinToExistingBoard={this.addPinToExistingBoard}
								addPinToNewBoard={this.addPinToNewBoard}

								toggleLoginRegisterModal={this.toggleLoginRegisterModal}
								loginRegisterModalisOpen={this.state.LoginRegisterModalisOpen}
								setUserData={this.setUserData}
								name={this.state.UserData.name}
							/>
						</main>
					}/>
					{
						this.state.ConfirmationToast.ShowConfirmationToast
						&& <ConfirmationToast ConfirmationToast={this.state.ConfirmationToast}/>
					}


				</div>
			</Router>
		);
	}
}

export default App;
