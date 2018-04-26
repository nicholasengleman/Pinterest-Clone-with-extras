import React from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import Highlight from "react-highlight-words";
import Tag from "./Tag/Tag";
import { Button, Text, Icon } from "gestalt";

import "gestalt/dist/gestalt.css";
import "./Product.css";
import "./Modal.css";

class Product extends React.Component {
  constructor(props) {
    super(props);
    this.cancelEditRestoreThisData = {};
    this.state = {
      editModalProductDescription: false,
      modalIsOpen: false,
      Favorited: {
        status: false,
        message: ""
      },
		personalizedDescription: this.props.productDescription,
      editMode: false,
      tags: this.props.productTags.toString(),
      imageSrc: this.props.productImage,
      name: this.props.productName,
      price: this.props.productPrice,
      description: this.props.productDescription
    };

    this.removeProduct = this.removeProduct.bind(this);
    this.toggleEditMode = this.toggleEditMode.bind(this);
    this.submitNewProductInfo = this.submitNewProductInfo.bind(this);
    this.toggleFavorite = this.toggleFavorite.bind(this);
    this.edit = this.edit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
	  this.submitNewPersonalizedDescription = this.submitNewPersonalizedDescription.bind(this);
  }

  static propTypes = {
    removeProduct: PropTypes.func,
    submitNewProductInfo: PropTypes.func,
    addToFavorites: PropTypes.func,
    favorites: PropTypes.array,
    removeFromFavorites: PropTypes.func,
    searchString: PropTypes.string,

    productImage: PropTypes.string,
    productName: PropTypes.string,
    productPrice: PropTypes.number,
    productDescription: PropTypes.string,
    productTags: PropTypes.array,
    productKey: PropTypes.number
  };

  componentDidMount() {
    if (this.state.tags.length === 0) {
      this.setState({ editMode: true, newProduct: true });
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.state.Favorited.status === true) {
      for (let favorite of nextProps.favorites) {
        if (nextProps.productKey === favorite.productKey) {
          return null;
        }
      }
      this.setState({
        Favorited: { status: false, message: "removed from favorites!" }
      });
    }
  }

  componentDidUpdate() {
    if (this.state.newProduct === true) {
      let content = document.getElementById("newProduct");
      let parent = content.parentNode;
      parent.insertBefore(content, parent.firstChild);
      this.setState({ newProduct: false });
    }
  }

  openModal() {
    this.setState({ modalIsOpen: true });
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  toggleFavorite(event) {
    if (!this.state.Favorited.status) {
      this.props.addToFavorites(this.props.productKey);
      this.setState({
        Favorited: { status: true, message: "added to favorites!" }
      });
    } else {
      this.props.removeFromFavorites(this.props.productKey);
      this.setState({
        Favorited: { status: false, message: "removed from favorites!" }
      });
    }
    event.preventDefault();
  }

  removeProduct(event) {
    this.props.removeProduct(this.props.productKey);
    event.preventDefault();
  }

  toggleEditMode(event) {
    if (this.state.editMode === false) {
      this.cancelEditRestoreThisData = {
        tags: this.state.tags,
        imageSrc: this.state.imageSrc,
        name: this.state.name,
        price: this.state.price,
        description: this.state.description
      };
    }
    this.setState(prevState => ({
      editMode: !prevState.editMode
    }));
    event.preventDefault();
  }

  cancelEdit(event) {
    this.setState({
      tags: this.cancelEditRestoreThisData.tags,
      imageSrc: this.cancelEditRestoreThisData.imageSrc,
      name: this.cancelEditRestoreThisData.name,
      price: this.cancelEditRestoreThisData.price,
      description: this.cancelEditRestoreThisData.description
    });
    this.setState(prevState => ({
      editMode: !prevState.editMode
    }));
    event.preventDefault();
  }

  submitNewProductInfo(event) {
    this.props.submitNewProductInfo(
      this.props.productKey,
      this.state.tags,
      this.state.imageSrc,
      this.state.name,
      this.state.price,
      this.state.description
    );
    this.toggleEditMode(event);
    if (this.state.newProduct === true) {
      this.setState({ newProduct: false });
    }
    event.preventDefault();
  }

  submitNewPersonalizedDescription(event) {
  	if(this.state.editModalProductDescription && event.target.id!=="description") {
  		this.setState({editModalProductDescription: false});
	}
  	event.preventDefault();
  }

  edit(e) {
    this.setState({ [e.target.id]: e.target.value });
  }



  render() {
    return (
      <div
        className="productBox"
        id={this.state.newProduct ? "newProduct" : null}
      >
        {this.state.editMode ? (
          <div>
            <p className="optionalWarning">all fields optional</p>
            <input
              id="imageSrc"
              type="text"
              placeholder="Image URL"
              onChange={this.edit}
              value={this.state.imageSrc}
            />
            <input
              id="tags"
              type="text"
              placeholder="Tags seperated by comma"
              onChange={this.edit}
              value={this.state.tags}
            />
            <input
              id="name"
              type="text"
              placeholder="Name"
              onChange={this.edit}
              value={this.state.name}
            />
            <input
              id="price"
              type="number"
              placeholder="Price"
              onChange={this.edit}
              value={this.state.price}
            />
            <textarea
              id="description"
              rows="5"
              placeholder="Description"
              value={this.state.description}
              onChange={this.edit}
            />
          </div>
        ) : (
          <div>
            {this.state.Favorited.message === "added to favorites!" ? (
              <div className="Message">{this.state.Favorited.message}</div>
            ) : null}
            {this.state.Favorited.message === "removed from favorites!" ? (
              <div className="Message">{this.state.Favorited.message}</div>
            ) : null}
            <div className="productPic">
              <img src={this.props.productImage} alt="" />
            </div>
            {this.state.tags ? (
              <div className="tagContainer">
                {this.props.productTags.map(tag => (
                  <Tag text={tag} key={tag} />
                ))}
              </div>
            ) : null}
            {this.state.name ? (
              <div>
                <div className="saveIcon">
                  <Button
                    onClick={this.openModal}
                    text="Save"
                    color="red"
                    inline
                    alt="save this product"
                  />
                </div>
                <Modal
                  isOpen={this.state.modalIsOpen}
                  onRequestClose={this.closeModal}
                  className="Modal"
                  overlayClassName="ReactModal__Overlay"
                  contentLabel="Example Modal"
                >
                  <div className="modal_ProductSummary" onClick={this.submitNewPersonalizedDescription}>
                    <div className="productPic">
                      <img src={this.props.productImage} alt="" />
                    </div>
                    <div>
                      {this.state.editModalProductDescription ? (
                        <form
                          onSubmit={this.submitNewPersonalizedDescription}
                        >
                          <textarea
                            id="description"
                            rows="6"
                            placeholder="Description"
                            value={this.props.productDescription}
                            onChange={this.edit}
                          />
                        </form>
                      ) : (
                        <div>
                          <div className="modal_productDescription">
                            <Text color="midnight" bold={true} size="sm">
                              {this.props.productDescription}
                            </Text>
                          </div>
                          <div
                            className="modal_productDescriptionEdit"
                            onClick={() =>
                              this.setState({
                                editModalProductDescription: true
                              })
                            }
                          >
                            <Icon
                              accessibilityLabel="edit"
                              icon="edit"
                              color="darkGray"
                              inline={true}
                              size={20}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal_Boards">
                    <h2>Choose Boards</h2>
                  </div>
                </Modal>
              </div>
            ) : null}
            <h1>
              <Highlight
                caseSensitive={false}
                searchWords={[this.props.searchString]}
                textToHighlight={this.props.productName}
              />
            </h1>
            {this.state.price ? (
              <div className="productPrice">${this.props.productPrice}</div>
            ) : null}
            {this.state.description ? (
              <div className="productDescription">
                <Highlight
                  caseSensitive={false}
                  searchWords={[this.props.searchString]}
                  textToHighlight={this.props.productDescription}
                />
              </div>
            ) : null}
          </div>
        )}

        <div className="editPanel">
          {this.state.editMode ? (
            <div>
              <button
                className="alwaysShow"
                onClick={this.submitNewProductInfo}
              >
                submit
              </button>
              <button className="alwaysShow" onClick={this.cancelEdit}>
                cancel
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={this.toggleEditMode}
                className={this.props.adminMode ? "alwaysShow" : ""}
              >
                edit
              </button>
              <button
                onClick={this.removeProduct}
                className={this.props.adminMode ? "alwaysShow" : ""}
              >
                remove
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Product;
