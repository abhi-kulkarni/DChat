import React, { useState, useEffect, useRef } from "react";
import { withRouter } from "react-router-dom";
import axiosInstance from "../components/axiosInstance";
import { useHistory } from "react-router-dom";
import { user_created_success, spinner_overlay, user_data } from "../redux";
import { useDispatch, useSelector } from "react-redux";
import "../index.css";
import AtomSpinner from "../components/Atomspinner";
import Jumbotron from 'react-bootstrap/Jumbotron'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { defaultProfilePictureImageDataUri } from "../constants";
import {
    FaTimes,
    FaCamera
} from "react-icons/fa";
import { Multiselect } from 'multiselect-react-dropdown';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Modal from "react-bootstrap/Modal";
import InputGroup from "react-bootstrap/InputGroup";
import Select from "react-dropdown-select";

function Profile(props) {

  const history = useHistory();
  const dispatch = useDispatch();
  let profilePageEnd = useRef(null);
  const store_overlay = useSelector((state) => state.session.spinner_overlay);
  const curr_user_data = useSelector((state) => state.session.user_data);
  const [user, setUser] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editSuccessful, setEditSuccessful] = useState(false);
  const [formData, setFormData] = useState({
    first_name:"",
    last_name:"",
    username: "",
    email: "",
    country: "",
    gender:"",
    profile_picture:""
  });
  const [formErrors, setFormErrors] = useState({
    first_name:"",
    last_name:"",
    username: "",
    email: "",
    gender:"",
    profile_picture:"",
  });
  const [crop, setCrop] = useState({ aspect: 16 / 9 });
  const [isDefaultProfilePicture, setIsDefaultProfilePicture] = useState(true);
  const [userEditedSuccessMsg, setUserEditedSuccessMsg] = useState("");
  const [countryOptions, setCountryOptions] = useState([{'name': 'India', 'id': 'India'}, {'name': 'England', 'id': 'England'}, {'name': 'Australia', 'id': 'Australia'}]);
  const [genderOptions, setGenderOptions] = useState([{'name': 'Male', 'id': 'Male'},{'name': 'Female', 'id': 'Female'}, {'name': 'Other', 'id': 'Other'}]);
  const genderDropDownRef = useRef(null);
  const countryDropDownRef = useRef(null);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside, false);
    getUserData();
    // getAllCountries();
  }, []);

  const handleClickOutside = (e) => {
    let elements = [...document.getElementsByClassName("optionListContainer")];
      let curr_gender_ele = null;
      let curr_country_ele = null;
      elements.map(item => {
        if(item.parentElement.id === "gender"){
          curr_gender_ele = item;
        }
        if(item.parentElement.id === "country"){
          curr_country_ele = item;
        }
      });
      if (
        genderDropDownRef &&
        e.target &&
        genderDropDownRef.current && !genderDropDownRef.current.contains(e.target)
      ) {
        curr_gender_ele?curr_gender_ele.style.display = 'none':'';
      }else{
        curr_gender_ele?curr_gender_ele.style.display = 'block':'';
      }
      if (
        countryDropDownRef &&
        e.target &&
        countryDropDownRef.current && !countryDropDownRef.current.contains(e.target)
      ) {
        curr_country_ele?curr_country_ele.style.display = 'none':'';
      }else{
        curr_country_ele?curr_country_ele.style.display = 'block':'';
      }
  };

  const emailRegex = RegExp(
    /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
  );

  const passwordRegex = RegExp(
    /^(?=\S*[a-z])(?=\S*[A-Z])(?=\S*\d)(?=\S*[^\w\s])\S{6,10}$/
  );

  const formValid = (formErrors, formData) => {
    let valid = true;

    // validate form errors being empty
    Object.values(formErrors).forEach((val) => {
      val.length > 0 && (valid = false);
    });

    // validate the form was filled out
    Object.values(formData).forEach((val) => {
      val === null && (valid = false);
    });

    return valid;
  };

  const handleSubmit = (e) => {
    let post_data = {};
    let valid = false;
    e.preventDefault();
    if (formValid(formErrors, formData)) {
      valid = true;
      post_data = formData;
    } else {
      valid = false;
      scrollToBottom();
      setUserEditedSuccessMsg("Some of your fields are empty or incorrect");
      setTimeout(function () {
        setUserEditedSuccessMsg("");
      }, 10000);
      console.error("FORM INVALID - DISPLAY ERROR MESSAGE");
    }
    if (valid) {
      spinner(true);
      axiosInstance
        .put("update_user/"+curr_user_data.id+'/', post_data)
        .then((response) => {
          spinnerStop();
          if (response.data.ok) {
            let edited_user = response.data.user;
            console.log(edited_user);
            setUser(edited_user)
            dispatch(user_data(edited_user));
            setUserEditedSuccessMsg("User edited succesfully");
            setEditSuccessful(true);
            setTimeout(function () {
              setUserEditedSuccessMsg("");
            }, 10000);
          } else {
            scrollToBottom();
            setUserEditedSuccessMsg(response.data.error);
            setEditSuccessful(false);
            setTimeout(function () {
              setUserEditedSuccessMsg("");
            }, 10000);
            console.log("Error");
          }
        })
        .catch((error) => {
          spinnerStop();
          setUserEditedSuccessMsg("Some error Occurred");
          setTimeout(function () {
            setUserEditedSuccessMsg("");
          }, 10000);
          console.log(error);
        });
    }
  };

  const passwordVisibilityToggle = (type) => {
    if (type === "password") {
      let password = !showPassword;
      setShowPassword(password);
    } else {
      let confirm_password = !showConfirmPassword;
      setShowConfirmPassword(confirm_password);
    }
  };

  const getAllCountries = () => {
    axiosInstance
      .get("https://api.first.org/data/v1/countries")
      .then((res) => {
        // spinnerStop();
        if (res) {
          setUser(res);
        } else {
          //pass
        }
      })
      .catch((err) => {
        // spinnerStop();
        console.log(err);
      });
  }

  const handleChange = (e) => {
    e.preventDefault();

    const { name, value } = e.target;

    // let password = formData.password;
    // let curr_password = document.getElementById("password").value;
    // let curr_confirm_password = document.getElementById("confirmPassword")
    //   .value;
    // if (
    //   curr_password !== curr_confirm_password &&
    //   curr_password.length > 0 &&
    //   curr_confirm_password.length > 0
    // ) {
    //   formErrors.confirmPassword =
    //     "password and confirm password should be the same";
    // } else {
    //   formErrors.confirmPassword = "";
    // }
    validate(name, value, "");
  };

  const setCountryData = (data) => {
    console.log(data);
  }

  const validate = (name, value, password) => {
    switch (name) {
      case "first_name":
        setFormData({ ...formData, first_name: value });
        if (value.length > 0 && value.length < 3) {
          setFormErrors({
            ...formErrors,
            first_name: "minimum 3 characters required",
          });
        } else {
          setFormErrors({ ...formErrors, first_name: "" });
        }
        break;
      case "last_name":
        setFormData({ ...formData, last_name: value });
        if (value.length > 0 && value.length < 3) {
          setFormErrors({
            ...formErrors,
            last_name: "minimum 3 characters required",
          });
        } else {
          setFormErrors({ ...formErrors, last_name: "" });
        }
        break;
      case "username":
        setFormData({ ...formData, username: value });
        if (value.length > 0 && value.length < 3) {
          setFormErrors({
            ...formErrors,
            username: "minimum 3 characters required",
          });
        } else {
          setFormErrors({ ...formErrors, username: "" });
        }
        break;
      case "email":
        setFormData({ ...formData, email: value });
        if (emailRegex.test(value)) {
          setFormErrors({ ...formErrors, email: "" });
        } else {
          if (value.length > 0) {
            setFormErrors({ ...formErrors, email: "invalid email address" });
          } else {
            setFormErrors({ ...formErrors, email: "" });
          }
        }
        break;
      case "password":
        setFormData({ ...formData, password: value });
        if (passwordRegex.test(value)) {
          setFormErrors({ ...formErrors, password: "" });
        } else {
          if (value.length > 0) {
            setFormErrors({
              ...formErrors,
              password: "password is invalid",
            });
          } else {
            setFormErrors({ ...formErrors, password: "" });
          }
        }
        break;
      case "confirmPassword":
        setFormData({ ...formData, confirmPassword: value });
        if (value.length > 0 && value !== password) {
          setFormErrors({
            ...formErrors,
            confirmPassword: "password and confirm password should be the same",
          });
        } else {
          setFormErrors({ ...formErrors, confirmPassword: "" });
        }
        break;
      default:
        break;
    }
  };

  const scrollToBottom = () => {
    let ele = document.getElementById("profilePageBottom");
    if (ele) {
      ele.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getUserData = () => {
    // if (store_overlay) {
    //   spinner(true);
    // }
    axiosInstance
      .get("get_curr_user/")
      .then((res) => {
        // spinnerStop();
        if (res.data.ok) {
          console.log(res.data.user);
          let user = res.data.user;
          let temp = {
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            email: user.email,
            country: user.country,
            gender: user.gender,
            profile_picture: user.profile_picture?user.profile_picture:''
          }
          setFormData(temp);
          setUser(res.data.user);
        } else {
          //pass
        }
      })
      .catch((err) => {
        // spinnerStop();
        console.log(err);
      });
  };

  const spinner = (display) => {
    display
      ? (document.getElementById("overlay").style.display = "block")
      : (document.getElementById("overlay").style.display = "none");
  };

  const spinnerStop = () => {
    dispatch(spinner_overlay(false));
    spinner(false);
  };

  const setDefaultProfilePicture = () => {
    setIsDefaultProfilePicture(true);
    setFormData({...formData, profile_picture: ""})
  }

  const handleProfilePictureChangeMethod = (e) => {
    let uploaded_img = e.target.files[0];
    setIsDefaultProfilePicture(false);
    if(uploaded_img){
        var reader = new FileReader();
        var baseString;
        reader.onloadend = function () {
            baseString = reader.result;
            setFormData({...formData, profile_picture: baseString})
        };
        reader.readAsDataURL(uploaded_img);
    }
  }

  const onSelectCountry = (selectedList, selectedItem) => {
    console.log(selectedItem)
    setFormData({...formData, country: selectedItem.id});
}

const onRemoveCountry = (selectedList, selectedItem) => {
    // setGroupFormData({...formData, country: selectedList});
}

const onSelectGender = (selectedList, selectedItem) => {
  setFormData({...formData, gender: selectedItem.id});
}

const onRemoveGender = (selectedList, selectedItem) => {
  // setGroupFormData({...groupFormData, group_members: selectedList});
}

  return (
    <div>
      <div id="overlay">
        <AtomSpinner />
      </div>
      <Row style={{ padding: '0px', margin : '0px'}}>
        <i className="pin"/>
        <Col className="shadow-lg rounded" xs={{ offset: 4, span: 4 }} sm={{ offset: 4, span: 4 }} md={{ offset: 4, span: 4 }} lg={{ offset: 4, span: 4 }} xl={{ offset: 4, span: 4 }} style={{ padding: '0px 20px', marginLeft: '35%' }}>
        <Row style={{ padding: '0px', margin: '0px' }}>
          <Col style={{ padding: '15px 0px 0px 0px', height: "80px", maxHeight: "80px" }} xs={{ offset: 3, span: 4 }} sm={{ offset: 3, span: 4 }} md={{ offset: 4, span: 4 }} lg={{ offset: 4, span: 5 }} xl={{ offset: 4, span: 5 }}>
              {/* <ReactCrop src={defaultGroupProfilePictureImageDataUri} crop={crop} onChange={newCrop => setGroupImageCrop(newCrop)} /> */}
              <img
                  width="75"
                  height="75"
                  className="profile_picture"
                  src={formData.profile_picture?formData.profile_picture:defaultProfilePictureImageDataUri}
                  alt="profile_picture"
                  />
                  
                  {isDefaultProfilePicture?<div className="profile_picture_upload">
                  <label htmlFor="upload_profile_picture">
                      <FaCamera className="profile_picture_uploader"/>
                  </label>
                  <input
                      accept="image/*"
                      onChange={handleProfilePictureChangeMethod}
                      id="upload_profile_picture"
                      type="file"
                  />
                  </div>:
                  <FaTimes className="profile_picture_remover" onClick={() => setDefaultProfilePicture()}/>}
          </Col>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} style={{ padding: '0x' }}>
          <Form style={{ padding: '30px 0px 0px 0px' }} className="row" onSubmit={(e) => handleSubmit(e)}>
          <Form.Group style={{ padding: '0px 10px 0px 0px' }} className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-xs-6" controlId="first_name">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  autoComplete="off"
                  name="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange(e)}
                  type="text"
                  placeholder="First Name"
                />
                <Row style={{ padding: "0px", margin: "0px" }}>
                  <Col style={{ padding: "0px" }}>
                    {formErrors.first_name.length > 0 && (
                      <span className="float-left errorMessage">
                        {formErrors.first_name}
                      </span>
                    )}
                  </Col>
                </Row>
              </Form.Group>
              <Form.Group style={{ padding: '0px 0px 0px 0px' }} className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-xs-6" controlId="last_name">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  autoComplete="off"
                  name="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange(e)}
                  type="text"
                  placeholder="Last Name"
                />
                <Row style={{ padding: "0px", margin: "0px" }}>
                  <Col style={{ padding: "0px" }}>
                    {formErrors.last_name.length > 0 && (
                      <span className="float-left errorMessage">
                        {formErrors.last_name}
                      </span>
                    )}
                  </Col>
                </Row>
              </Form.Group>
            <Form.Group style={{ padding: '0px 0px 0px 0px' }} className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-xs-12" controlId="username">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  autoComplete="off"
                  name="username"
                  value={formData.username}
                  onChange={(e) => handleChange(e)}
                  type="text"
                  placeholder="Enter username"
                />
                <Row style={{ padding: "0px", margin: "0px" }}>
                  <Col style={{ padding: "0px" }}>
                    {formErrors.username.length > 0 && (
                      <span className="float-left errorMessage">
                        {formErrors.username}
                      </span>
                    )}
                  </Col>
                </Row>
              </Form.Group>
              <Form.Group style={{ padding: '0px 0px 0px 0px' }} className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-xs-12" controlId="email">
                <Form.Label>Email address</Form.Label>
                <InputGroup>
                  <InputGroup.Prepend>
                    <InputGroup.Text id="email_prepend">@</InputGroup.Text>
                  </InputGroup.Prepend>
                  <Form.Control
                    autoComplete="off"
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) => handleChange(e)}
                  ></Form.Control>
                </InputGroup>
                <Row style={{ padding: "0px", margin: "0px" }}>
                  <Col style={{ padding: "0px" }}>
                    {formErrors.email.length > 0 && (
                      <span className="float-left errorMessage">
                        {formErrors.email}
                      </span>
                    )}
                  </Col>
                </Row>
              </Form.Group>
              <Form.Group style={{ padding: '0px 10px 0px 0px' }} className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-xs-6" ref={countryDropDownRef} controlId="selectCountry">
                <Form.Label>Select Country</Form.Label>
                <Multiselect
                    id="country"
                    placeholder="Select Country"
                    options={countryOptions} 
                    onSelect={onSelectCountry} 
                    onRemove={onRemoveCountry}
                    selectedValues={[{'name': formData.country, 'id': formData.country}]}
                    displayValue="name"
                    singleSelect={true}
                    closeOnSelect={true}
                    style={{
                      chips: { 
                      padding: '0px 5px',
                      fontWeight: 'normal',
                      fontSize: '1rem'
                      },
                      searchBox:{
                        height: '40px'
                      }
                    }}
                />
                </Form.Group>
                <Form.Group style={{ padding: '0px 0px 0px 0px' }} className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-xs-6" ref={genderDropDownRef} controlId="selectGender">
                <Form.Label>Select Gender</Form.Label>
                <Multiselect
                    id="gender"
                    placeholder="Select Gender"
                    options={genderOptions} 
                    onSelect={onSelectGender}
                    selectedValues={[{'name': formData.gender, 'id': formData.gender}]}
                    closeOnSelect={true} 
                    onRemove={onRemoveGender}
                    singleSelect={true}
                    style={{
                      chips: { 
                      padding: '0px 5px',
                      fontWeight: 'normal',
                      fontSize: '1rem'
                      },
                      option:{
                        color: 'black'
                      },
                      searchBox:{
                        height: '40px'
                      }
                    }}
                    displayValue="name"
                />
                </Form.Group>
              <Button
                style={{ margin: userEditedSuccessMsg ?"5% 0% 1% 0%":"5% 0% 5% 0%" }}
                className="btn-block"
                variant="primary"
                type="submit"
              >
                Save Changes
              </Button>
              </Form>
              {!userEditedSuccessMsg ? (
            ""
          ) : (
            <Row style={{ margin: "8px 0px 2px 0px", padding: "0px" }}>
              <Col style={{ width: "100%" }}>
                <div
                  style={{ display: "table", margin: "0 auto" }}
                  className={editSuccessful?"profile_edit_success_msg":"form_error_message"}
                >
                  {userEditedSuccessMsg}
                </div>
              </Col>
            </Row>
          )}
          </Col>
      </Row>
      </Col>
      </Row>
      <div id="profilePageBottom"
        ref={(el) => {
        profilePageEnd = el;
        }}>
      </div>
    </div>
  );
}

export default withRouter(Profile);
