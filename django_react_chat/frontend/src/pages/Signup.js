import React, {useState, useEffect} from "react";
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import InputGroup from 'react-bootstrap/InputGroup'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import {Orientation} from "../components/Orientation";
import {FaEye, FaEyeSlash, FaArrowLeft, FaExclamationTriangle} from "react-icons/fa";
import API_URL from '../constants/'
import axios from 'axios'
import {useHistory} from 'react-router-dom'
import {user_created_success, spinner_overlay} from '../redux'
import {useDispatch, useSelector} from "react-redux";
import AtomSpinner from '../components/Atomspinner'
import CSRFToken from "../components/csrf";
import '../index.css'

function SignUp(props) {

    const [windowDimensions, setWindowDimensions] = useState({
        'height': window.innerHeight,
        'width': window.innerWidth
    });
    const history = useHistory();
    const [orientation, setOrientation] = useState('default');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [signUpSuccessMsg, setSignUpSuccessMsg] = useState("");
    const dispatch = useDispatch();
    const store_overlay = useSelector(state => state.session.spinner_overlay);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [formErrors, setFormErrors] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const emailRegex = RegExp(
        /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    );

    const passwordRegex = RegExp(
        /^(?=\S*[a-z])(?=\S*[A-Z])(?=\S*\d)(?=\S*[^\w\s])\S{6,10}$/
    );

    const formValid = (formErrors, formData) => {

        let valid = true;

        // validate form errors being empty
        Object.values(formErrors).forEach(val => {
            val.length > 0 && (valid = false);
        });

        // validate the form was filled out
        Object.values(formData).forEach(val => {
            val === null && (valid = false);
        });

        return valid;
    };


    const handleSubmit = (e, type, data) => {

        let post_data = {};
        let valid = false;
        if (type === 'sso') {
            post_data = data;
            valid = true;
        } else {
            e.preventDefault();
            if (formValid(formErrors, formData)) {
                valid = true;
                post_data = formData;
            } else {
                valid = false;
                setSignUpSuccessMsg("Some of your fields are empty or incorrect");
                setTimeout(function () {
                    setSignUpSuccessMsg("")
                }, 10000);
                console.error("FORM INVALID - DISPLAY ERROR MESSAGE");
            }
        }

        if (store_overlay) {
            spinner(true)
        }

        if (valid) {
            if (post_data.hasOwnProperty('confirmPassword')) {
                delete post_data['confirmPassword']
            }
            axios.post(API_URL + 'signup/', post_data).then(response => {
                spinnerStop();
                if (response.data.ok) {
                    dispatch(user_created_success());
                    history.push('/')
                } else {
                    setSignUpSuccessMsg(response.data.error);
                    setTimeout(function () {
                        setSignUpSuccessMsg("")
                    }, 10000);
                    console.log("Error")
                }
            }).catch(error => {
                spinnerStop();
                setSignUpSuccessMsg("Some error Occurred");
                setTimeout(function () {
                    setSignUpSuccessMsg("")
                }, 10000);
                console.log(error)
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

    const handleChange = e => {
        e.preventDefault();

        const {name, value} = e.target;

        let password = formData.password;
        let curr_password = document.getElementById('password').value;
        let curr_confirm_password = document.getElementById('confirmPassword').value;
        if (curr_password !== curr_confirm_password && curr_password.length > 0 && curr_confirm_password.length > 0) {
            formErrors.confirmPassword = "password and confirm password should be the same";
        } else {
            formErrors.confirmPassword = "";
        }
        validate(name, value, password);
    };

    const validate = (name, value, password) => {
        switch (name) {
            case "username":
                setFormData({...formData, username: value});
                if (value.length > 0 && value.length < 3) {
                    setFormErrors({...formErrors, username: "minimum 3 characters required"})
                } else {
                    setFormErrors({...formErrors, username: ""})
                }
                break;
            case "email":
                setFormData({...formData, email: value});
                if (emailRegex.test(value)) {
                    setFormErrors({...formErrors, email: ""})
                } else {
                    if (value.length > 0) {
                        setFormErrors({...formErrors, email: "invalid email address"})
                    } else {
                        setFormErrors({...formErrors, email: ""})
                    }
                }
                break;
            case "password":
                setFormData({...formData, password: value});
                if (passwordRegex.test(value)) {
                    setFormErrors({...formErrors, password: ""})
                } else {
                    if (value.length > 0) {
                        setFormErrors({
                            ...formErrors,
                            password: "password is invalid"
                        })
                    } else {
                        setFormErrors({...formErrors, password: ""})
                    }
                }
                break;
            case "confirmPassword":
                setFormData({...formData, confirmPassword: value});
                if (value.length > 0 && value !== password) {
                    setFormErrors({...formErrors, confirmPassword: "password and confirm password should be the same"})
                } else {
                    setFormErrors({...formErrors, confirmPassword: ""})
                }
                break;
            default:
                break;
        }
    };

    const spinner = (display) => {
        display?document.getElementById("overlay").style.display = "block": document.getElementById("overlay").style.display = "none";
    };
    
    const spinnerStop = () => {
        dispatch(spinner_overlay(false));
        spinner(false);
    };

    return (
        <div>
            <div id="overlay">
                <AtomSpinner/>
            </div>
            <Orientation getData={setOrientation}/>
            <div className="custom_row" style={{padding: "1% 0% 0% 0%", margin: "0px"}}>
                <Col xs={12} sm={12} md={12} lg={12} xl={{ span:4 }}>
                    <Form onSubmit={e => handleSubmit(e, "signup", "")}>
                        <CSRFToken/>
                        <Form.Group>
                            <div className="text-center" style={{ fontSize: "1.5rem" }}><b>Sign Up</b></div>
                        </Form.Group>
                        <Form.Group controlId="username">
                            <Form.Label>Username</Form.Label>
                            <Form.Control name="username" value={formData.username} onChange={e => handleChange(e)} type="text" placeholder="Enter username" />
                            <Row style={{padding: "0px", margin: "0px"}}>
                                <Col style={{padding: "0px"}}>
                                    {formErrors.username.length > 0 && (
                                        <span className="float-left errorMessage">{formErrors.username}</span>
                                    )}
                                </Col>
                            </Row>
                        </Form.Group>
                        <Form.Group controlId="email">
                            <Form.Label>Email address</Form.Label>
                            <InputGroup>
                                <InputGroup.Prepend>
                                    <InputGroup.Text id="email_prepend">
                                        @
                                    </InputGroup.Text>
                                </InputGroup.Prepend>
                                <Form.Control name="email" type="email" placeholder="Enter email"
                                                value={formData.email} onChange={e => handleChange(e)}>

                                </Form.Control>
                            </InputGroup>
                            <Row style={{padding: "0px", margin: "0px"}}>
                                <Col style={{padding: "0px"}}>
                                    {formErrors.email.length > 0 && (
                                        <span className="float-left errorMessage">{formErrors.email}</span>
                                    )}
                                </Col>
                            </Row>
                        </Form.Group>
                        <Form.Group controlId="password">
                            <Form.Label>Password</Form.Label>
                            <InputGroup>
                                <Form.Control autoComplete="off" name="password" type={showPassword ? "text" : "password"}
                                                value={formData.password} onChange={e => handleChange(e)}
                                                placeholder="Enter Password">

                                </Form.Control>
                                <InputGroup.Append>
                                    <InputGroup.Text className="cursor-pointer"
                                                        onClick={() => passwordVisibilityToggle("password")}>
                                        {showPassword ? <FaEye style={{color: "#007BFF"}}/> :
                                            <FaEyeSlash style={{color: "#007BFF"}}/>}
                                    </InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                            <Row style={{padding: "0px", margin: "0px"}}>
                                <Col style={{padding: "0px"}}>
                                    {formErrors.password.length > 0 && (
                                        <span
                                            className="float-left errorMessage">{formErrors.password}<OverlayTrigger
                                            key="top"
                                            placement="top"
                                            overlay={
                                                <Tooltip>
                                                    <span>password must contain minimum 6 and maximum 10 characters, at least one uppercase letter, one lowercase letter, one number and one special character</span>
                                                </Tooltip>
                                            }
                                        ><FaExclamationTriangle style={{
                                            margin: "0px 0px 4px 10px",
                                            cursor: "pointer"
                                        }}/></OverlayTrigger></span>
                                    )}
                                </Col>
                            </Row>
                        </Form.Group>
                        <Form.Group controlId="confirmPassword">
                            <Form.Label>Confirm Password</Form.Label>
                                <InputGroup>
                                    <Form.Control autoComplete="off" name="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={formData.confirmPassword}
                                                onChange={e => handleChange(e)}
                                                placeholder="Confirm Password">

                                    </Form.Control>
                                    <InputGroup.Append>
                                        <InputGroup.Text className="cursor-pointer"
                                                        onClick={() => passwordVisibilityToggle("confirm_password")}>
                                            {showConfirmPassword ? <FaEye style={{color: "#007BFF"}}/> :
                                                <FaEyeSlash style={{color: "#007BFF"}}/>}
                                        </InputGroup.Text>
                                    </InputGroup.Append>
                                </InputGroup>
                                <Row style={{padding: "0px", margin: "0px"}}>
                                    <Col style={{padding: "0px"}}>
                                        {formErrors.confirmPassword.length > 0 && formErrors.password.length <= 0 && (
                                            <span
                                                className="float-left errorMessage">{formErrors.confirmPassword}</span>
                                        )}
                                    </Col>
                                </Row>
                        </Form.Group>
                        <Button style={{ marginTop: '7%' }} className="btn-block" variant="success" type="submit">
                            Sign Up
                        </Button>       
                    </Form>
                    {!signUpSuccessMsg ? "" : <Row style={{margin: "8px 0px 0px 0px", padding: "0px"}}>
                        <Col style={{ 'width': '100%' }}>
                            <div style={{ 'display': 'table', 'margin': '0 auto'  }} className="form_error_message">{signUpSuccessMsg}</div>
                        </Col>
                    </Row>}
                </Col>
            </div>
        </div>
    );
}

export default SignUp
