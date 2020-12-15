import React, {useState, useEffect} from "react";
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import InputGroup from 'react-bootstrap/InputGroup'
import Modal from 'react-bootstrap/Modal'
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import {Orientation} from "../components/Orientation";
import {FaEye, FaEyeSlash, FaEnvelopeOpen, FaUserShield, FaCheckCircle} from "react-icons/fa";
import API_URL from '../constants/'
import {spinner_overlay, sign_in, user_data, user_created_success, friend_requests} from '../redux'
import AtomSpinner from '../components/Atomspinner'
import axios from 'axios'
import {Link, Redirect, useHistory} from 'react-router-dom'
import {useDispatch, useSelector} from "react-redux";
import CSRFToken from "../components/csrf";
import '../index.css'
import axiosInstance from '../components/axiosInstance'

function SignIn(props) {

    const [windowDimensions, setWindowDimensions] = useState({
        'height': window.innerHeight,
        'width': window.innerWidth
    });
    const history = useHistory();
    const dispatch = useDispatch();
    const store_overlay = useSelector(state => state.session.spinner_overlay);
    const store_user_created_success = useSelector(state => state.session.user_created_success);
    const store_forgot_password_clicked = useSelector(state => state.session.forgot_password_clicked);
    const [userCreatedMsg, setUserCreatedMsg] = useState("");
    const [orientation, setOrientation] = useState('default');
    const [email, setEmail] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [password, setPassword] = useState("");
    const [isValidLogin, setIsValidLogin] = useState(true);
    const [redirect, setRedirect] = useState(true);
    const [isIncorrectPassword, setIsIncorrectPassword] = useState("");
    const [isIncorrectEmail, setIsIncorrectEmail] = useState(false);
    const [incorrectEmailMsg, setIncorrectEmailMsg] = useState("");
    const [isValidResetEmail, setIsValidResetEmail] = useState(false);
    const [isValidResetPassword, setIsValidResetPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
    const [resetPasswordModal, setResetPasswordModalShow] = useState(false);
    const [tabKey, setTabKey] = useState('email');
    const [resetPasswordFormData, setResetPasswordFormData] = useState({
        resetPassword: "",
        resetPasswordConfirm: "",
    });
    const [resetEmailFormData, setResetEmailFormData] = useState({
        resetEmail: "",
    });
    const [formErrors, setFormErrors] = useState({
        resetEmail: "",
        resetPassword: "",
        resetPasswordConfirm: "",
    });

    const emailRegex = RegExp(
        /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    );

    const passwordRegex = RegExp(
        /^(?=\S*[a-z])(?=\S*[A-Z])(?=\S*\d)(?=\S*[^\w\s])\S{6,10}$/
    );

    useEffect(() => {
        if (store_user_created_success) {
            setUserCreatedMsg("Your account has been created successfully.");
            setTimeout(function () {
                setUserCreatedMsg("")
            }, 10000);
        }
        if(store_forgot_password_clicked){
            blinkElement();
            setTimeout(function () {
                const el = document.getElementById("forgot_password");
                if (el.classList.contains("blink_me")) {
                    el.classList.remove("blink_me");
                }
            }, 5000);
        }

    }, []);

    const blinkElement = () => {
        var ele = document.getElementById("forgot_password");
        ele.className += " blink_me";
    }

    const passwordVisibilityToggle = (id, reset, type) => {
        if (reset) {
            if (type === "new") {
                let reset_password = !showResetPassword;
                setShowResetPassword(reset_password);
            } else {
                let reset_password_confirm = !showResetPasswordConfirm;
                setShowResetPasswordConfirm(reset_password_confirm);
            }
        } else {
            let login_password = !showPassword;
            setShowPassword(login_password);
        }
    };

    const handleSubmit = (e, type, data) => {

        let post_data = {};
        if(type === "sso"){
            post_data = data
        }else{
            e.preventDefault();
            post_data = {"email": email, "password": password, "type": type};
        }
        axiosInstance.post('signin/', post_data).then(res => {
            spinnerStop();
            if(res.data.ok) {
                localStorage.setItem('refreshToken', res.data.refresh);
                localStorage.setItem('accessToken', res.data.access);
                dispatch(sign_in());
                dispatch(user_data(res.data.user));
                console.log(res.data.user.friend_requests);
                dispatch(friend_requests(res.data.user.friend_requests));
                setIsValidLogin(true);
                history.push('/home');
            }else{
                let err_msg = res.data?res.data.error:'Some of the fields are incorrect.';
                setIsValidLogin(false);
                setErrorMessage(err_msg);
                setTimeout(function () {
                    setErrorMessage("");
                }, 10000);
            }
    }).catch(err => {
        setIsValidLogin(false);
        spinnerStop();
        console.log(err)
    });
    };

    const formValid = (formErrors, formData, type) => {
        let valid = true;

        // validate form errors being empty
        Object.values(formErrors).forEach(val => {
            val.length > 0 && (valid = false);
        });
        if(Object.values(formData).length <= 0){
            valid = false;
        }
        Object.values(formData).forEach(val => {
            if(!val || val === ""){
                valid = false;
            }
        });

        return valid;
    };

    const resetPassword = () => {
        if (formValid(formErrors, resetPasswordFormData, "password")) {
            setIsValidResetPassword(true);
            closeResetPasswordModal();
            console.log(`
        --SUBMITTING--
        Reset Password: ${resetPasswordFormData.resetPassword}
        Password: ${resetPasswordFormData.resetPasswordConfirm}
      `);
        } else {
            setIsValidResetPassword(false);
            setFormErrors({...formErrors, resetPassword: ""});
            setFormErrors({...formErrors, resetPasswordConfirm: ""});
            setIsIncorrectPassword(true);
            console.error("FORM INVALID - DISPLAY ERROR MESSAGE");
        }
    };


    const handleChange = e => {

        e.preventDefault();

        const {name, value} = e.target;
        let password = resetPasswordFormData.resetPassword;
        if (tabKey == 'password') {
            let curr_reset_password = document.getElementById('reset_password').value;
            let curr_reset_confirm_password = document.getElementById('reset_password_confirm').value;
            if (curr_reset_password !== curr_reset_confirm_password && curr_reset_password.length > 0 && curr_reset_confirm_password.length > 0) {
                formErrors.resetPasswordConfirm = "password and confirm password should be the same";
            } else {
                formErrors.resetPasswordConfirm = "";
            }
        }
        validate(name, value, password);
    };

    const validate = (name, value, password) => {
        setIncorrectEmailMsg("");
        switch (name) {
            case "resetEmail":
                setResetEmailFormData({...resetEmailFormData, resetEmail: value});
                if (emailRegex.test(value)) {
                    setFormErrors({...formErrors, resetEmail: ""})
                } else if(value.length === 0) {
                        setFormErrors({...formErrors, resetEmail: "email field is required"})
                }else{
                    if (value.length > 0) {
                        setFormErrors({...formErrors, resetEmail: "invalid email address"})
                    } else {
                        setIsIncorrectEmail(false);
                    setFormErrors({...formErrors, resetEmail: ""})
                    }
                }
                break;
            case "resetPassword":
                setIsIncorrectPassword(false);
                setResetPasswordFormData({...resetPasswordFormData, resetPassword: value});
                if (passwordRegex.test(value)) {
                    setFormErrors({...formErrors, resetPassword: ""})
                } else if (value.length == 0) {
                    setFormErrors({...formErrors, resetPassword: "password field is required"})
                }else {
                    if (value.length > 0) {
                        setFormErrors({
                            ...formErrors,
                            resetPassword: "password must contain minimum 6 and maximum 10 characters, at least one uppercase letter, one lowercase letter, one number and one special character"
                        })
                    } else {
                        setFormErrors({...formErrors, resetPassword: ""})
                    }
                }
                break;
            case "resetPasswordConfirm":
                setResetPasswordFormData({...resetPasswordFormData, resetPasswordConfirm: value});
                if (value.length > 0 && value !== password) {
                    setFormErrors({
                        ...formErrors,
                        resetPasswordConfirm: "password and confirm password should be the same"
                    })
                } else if (value.length == 0) {
                    setFormErrors({...formErrors, resetPasswordConfirm: "confirm password field is required"})
                } else {
                    setIsIncorrectPassword(false);
                    setFormErrors({...formErrors, resetPasswordConfirm: ""})
                }
                break;
            default:
                break;
        }
    };

    const openResetPasswordModal = () => {
        setIsValidResetEmail(false);
        setTabKey("email");
        setResetPasswordModalShow(true);
        setFormErrors({
           ...formErrors, resetEmail: ""
        });
        setIncorrectEmailMsg("");
        setResetPasswordFormData({
            resetPassword: "",
            resetPasswordConfirm: ""
        });
        setResetEmailFormData({resetEmail: ""});
    };

    const closeResetPasswordModal = () => {
        setResetPasswordModalShow(false);
        spinnerStop();
        props.history.push('/signin')
    };

    const validateEmail = () => {
        
        if (store_overlay) {
            spinner(true);
        }
        let post_data = {};
        if (formValid(formErrors, resetEmailFormData, "email")) {
            post_data['email'] = resetEmailFormData.resetEmail;
            axiosInstance.post('validate_email/', post_data).then(res => {
                spinnerStop();
                if (res.data.ok) {
                    setIsValidResetEmail(true);
                    setTabKey("password");
                } else {
                    setIsValidResetEmail(false);
                    setFormErrors({...formErrors, resetEmail: ""});
                    setIsIncorrectEmail(true);
                    setIncorrectEmailMsg("No such user exists");
                }
            }).catch(err => {
                spinnerStop();
                setIsValidResetEmail(false);
                setFormErrors({...formErrors, resetEmail: ""});
                setIsIncorrectEmail(true);
                setIncorrectEmailMsg("No such user exists");
            });
            console.log('VALID')
        } else {
            setIsValidResetEmail(false);
            setFormErrors({...formErrors, resetEmail: ""});
            setIsIncorrectEmail(true);
            setIncorrectEmailMsg("Some of the fields are empty or incorrect");
            console.error("FORM INVALID - DISPLAY ERROR MESSAGE");
        }
    };

    const spinner = (display) => {
        let overlay_ele = document.getElementById("overlay")
        overlay_ele && display ? overlay_ele.style.display = "block" : overlay_ele.style.display = "none";
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
            <Modal
                show={resetPasswordModal} onHide={closeResetPasswordModal}
                size="md"
                backdrop="static"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header style={{padding: "2%"}}>
                    <Modal.Title id="contained-modal-title-vcenter">
                    <span style={{fontSize: "1.2rem"}}>Reset Password</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{paddingTop: '0px', paddingLeft: '0px', paddingRight: '0px'}}>
                <Tabs
                    className="nav-justified"
                    id="reset_password_tabs"
                    activeKey={tabKey}
                    onSelect={(k) => setTabKey(k)}
                    >
                    <Tab eventKey="email" title={<span style={{color: tabKey === "email" ? "#007BFF" : ""}}><FaEnvelopeOpen
                                 style={{ marginBottom: "5px", marginRight: "15px", color: "#007BFF"}}/> Verify Email</span>}>
                       <Row style={{margin: "0px", padding: "0px"}}>
                                <Col sm={12} xs={12} md={12} style={{marginTop: "2%"}}>
                                    <Form style={{marginTop: "20px"}}>
                                        <Form.Group controlId="reset_email">
                                            <InputGroup>
                                                <InputGroup.Prepend>
                                                    <InputGroup.Text id="reset_email_prepend">
                                                        @
                                                    </InputGroup.Text>
                                                </InputGroup.Prepend>
                                                <Form.Control name="resetEmail" type="email"
                                                              placeholder="Enter Email Id"
                                                              value={resetEmailFormData.resetEmail}
                                                              onChange={e => handleChange(e)}>

                                                </Form.Control>
                                            </InputGroup>
                                            <Row style={{margin: "8px 0px 0px 0px", padding: "0px"}}>
                                                <Col sm={12} xs={12} md={12} style={{padding: "0px"}}>
                                                    {formErrors.resetEmail.length > 0 && (
                                                        <span
                                                            className="float-left errorMessage">{formErrors.resetEmail}</span>
                                                    )}
                                                        {isValidResetEmail && tabKey == "email" ?
                                                        <span className="validate_email_message">Email has been verified ! <FaCheckCircle
                                                            style={{
                                                                marginBottom: "3px",
                                                                marginLeft: "10px",
                                                                color: "green"
                                                            }}/></span> : ""}
                                                    {isIncorrectEmail && formErrors.resetEmail.length <= 0 ?
                                                        <span className="errorMessage">{incorrectEmailMsg}</span> : ""}
                                                </Col>
                                            </Row>
                                        </Form.Group>
                                    </Form>
                                </Col>
                            </Row>
                    </Tab>
                    <Tab disabled eventKey="password" title={<span style={{color: tabKey == "password" ? "#228B22" : ""}}><FaUserShield style={{
                                 marginBottom: "5px",
                                 marginRight: "15px",
                                 color: isValidResetEmail ? "#228B22" : "gray"
                             }}/>Password</span>}>
                        <Row style={{margin: "0px", padding: "0px"}}>
                                <Col sm={12} xs={12} md={12} style={{marginTop: "2%"}}>
                                    <Form style={{marginTop: "20px"}}>
                                        <Form.Group controlId="reset_password">
                                            <InputGroup>
                                                <Form.Control name="resetPassword"
                                                              type={showResetPassword ? "text" : "password"}
                                                              value={resetPasswordFormData.resetPassword}
                                                              onChange={e => handleChange(e)}
                                                              placeholder="Enter New Password">

                                                </Form.Control>
                                                <InputGroup.Append>
                                                    <InputGroup.Text className="cursor_pointer"
                                                                     onClick={() => passwordVisibilityToggle("reset_password", true, "new")}>
                                                        {showResetPassword ? <FaEye style={{color: "#007BFF"}}/> :
                                                            <FaEyeSlash style={{color: "#007BFF"}}/>}
                                                    </InputGroup.Text>
                                                </InputGroup.Append>
                                            </InputGroup>
                                            <Row style={{margin: "8px 0px 0px 0px", padding: "0px"}}>
                                                <Col sm={12} xs={12} md={12} style={{padding: "0px"}}>
                                                    {formErrors.resetPassword.length > 0 && (
                                                        <span
                                                            className="float-left errorMessage">{formErrors.resetPassword}</span>
                                                    )}
                                                </Col>
                                            </Row>
                                        </Form.Group>
                                        <Form.Group controlId="reset_password_confirm">
                                            <InputGroup>
                                                <Form.Control name="resetPasswordConfirm"
                                                              type={showResetPasswordConfirm ? "text" : "password"}
                                                              value={resetPasswordFormData.resetPasswordConfirm}
                                                              onChange={e => handleChange(e)}
                                                              placeholder="Confirm Password">

                                                </Form.Control>
                                                <InputGroup.Append>
                                                    <InputGroup.Text className="cursor_pointer"
                                                                     onClick={() => passwordVisibilityToggle("reset_password_confirm", true, "confirm")}>
                                                        {showResetPasswordConfirm ?
                                                            <FaEye style={{color: "#007BFF"}}/> :
                                                            <FaEyeSlash style={{color: "#007BFF"}}/>}
                                                    </InputGroup.Text>
                                                </InputGroup.Append>
                                            </InputGroup>
                                            <Row style={{margin: "8px 0px 0px 0px", padding: "0px"}}>
                                                <Col sm={12} xs={12} md={12} style={{padding: "0px"}}>
                                                    {formErrors.resetPasswordConfirm.length > 0 && formErrors.resetPassword.length <= 0 && (
                                                        <span
                                                            className="float-left errorMessage">{formErrors.resetPasswordConfirm}</span>
                                                    )}
                                                </Col>
                                            </Row>
                                            <Row style={{margin: "8px 0px 0px 0px", padding: "0px"}}>
                                                <Col sm={12} xs={12} md={12}>{isIncorrectPassword && (formErrors.resetPassword.length <= 0 || formErrors.resetPasswordConfirm.length <= 0) ?
                                                    <span className="float-left errorMessage">Some of the fields are empty or incorrect</span> : ""}</Col>
                                            </Row>
                                        </Form.Group>
                                    </Form>
                                </Col>
                            </Row>
                    </Tab>
                    </Tabs>
                </Modal.Body>
                <Modal.Footer>
                    <Row style={{padding: "0px", margin: "0px"}}>
                        <Col style={{padding:"0px"}} xs={{ span:(tabKey === "password" || tabKey === "email" && !isValidResetEmail) ? 8:4 }} sm={{span:(tabKey === "password" || tabKey === "email" && !isValidResetEmail) ? 8:4}} md={{ span:(tabKey === "password" || tabKey === "email" && !isValidResetEmail) ? 8:4 }} lg={{ span:(tabKey === "password" || tabKey === "email" && !isValidResetEmail) ? 8:4 }}>
                            {isValidResetEmail && tabKey === "email" ? <OverlayTrigger
                        key="bottom"
                        placement="top"
                        overlay={
                            <Tooltip id="email_reset_tooltip">
                                <span>Reset your password on the next tab.</span>
                            </Tooltip>
                        }
                    ><FaUserShield onClick={() => setTabKey("password")} size="20px" style={{
                        cursor: "pointer",
                        color: "#007BFF"
                    }}/></OverlayTrigger> : ""}
                    {isValidResetEmail && tabKey === "email" ? "" : <Button className="float-right" size="sm"
                                                                        onClick={tabKey === 'email' ? () => validateEmail() : () => resetPassword()}
                                                                        type="submit">{tabKey === 'email' ? 'Validate Email' : 'Reset Password'}</Button>}
                        </Col>
                        <Col xs={2} sm={2} md={2} lg={2}>
                            <Button className="float-left" size="sm" variant="danger" onClick={() => closeResetPasswordModal()}>Close</Button>
                        </Col>
                    </Row>
                </Modal.Footer>
            </Modal>
            <div className="custom_row" style={{padding: "6% 0% 0% 0%", margin: "0px"}}>
                <Col xs={12} sm={12} md={12} lg={12} xl={{ span:4 }}>
                    <Form onSubmit={e => handleSubmit(e, "login", "")}>
                        <CSRFToken/>
                        <Form.Group>
                            <div className="text-center" style={{ fontSize: "1.5rem", paddingBottom: '2%' }}><b>Sign In</b></div>
                        </Form.Group>
                        <Form.Group controlId="email">
                        <Form.Label>Email</Form.Label>
                            <InputGroup>
                                <InputGroup.Prepend>
                                    <InputGroup.Text id="email_prepend">
                                        @
                                    </InputGroup.Text>
                                </InputGroup.Prepend>
                                <Form.Control name="email" type="email" placeholder="Enter Email"
                                                value={email} onChange={e => setEmail(e.target.value)}>

                                </Form.Control>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group controlId="password">
                            <Form.Label>Password</Form.Label>
                            <InputGroup>
                                <Form.Control name="password" type={showPassword ? "text" : "password"}
                                                value={password} onChange={e => setPassword(e.target.value)}
                                                placeholder="Enter Password">

                                </Form.Control>
                                <InputGroup.Append>
                                    <InputGroup.Text className="cursor-pointer"
                                                        onClick={() => passwordVisibilityToggle("password", false, "")}>
                                        {showPassword ? <FaEye style={{color: "#007BFF"}}/> :
                                            <FaEyeSlash style={{color: "#007BFF"}}/>}
                                    </InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                        </Form.Group>
                        <Row style={{'margin': '0px', 'padding': '0px'}}>
                            <Col style={{ 'paddingRight': '1%' }} xs={{ span: '6', offset: '6' }} sm={{ span: '5', offset: '7' }} md={{ span: '4', offset: '8' }} lg={{ span: '4', offset: '8' }} xl={{ span: '4', offset: '8' }}>
                                <p id="forgot_password" onClick={() => openResetPasswordModal()} style={{'color': '#0879FA', 'textDecoration': 'none'}} className="cursor-pointer forgot-password text-right">
                                    Forgot password ?
                                </p>
                            </Col>
                        </Row>
                        <Button style={{ marginTop: '3%' }} className="btn-block" variant="success" type="submit">
                            Sign In
                        </Button>
                        <Row style={{margin: "0px", padding: "0% 0% 5% 0%"}}>
                            <Col style={{paddingTop: "8px"}}>
                                <div className="text-center" style={{fontSize: "0.9rem", paddingTop: "15px"}}>Not a user yet ?
                                    <Link style={{textDecoration: "none"}} to="/signup">
                                        <span className="cursor_pointer" style={{ color: "#0879FA", marginLeft: "5px"}}>Sign Up Here.</span>
                                    </Link>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                    {!isValidLogin ?<Row style={{margin: "0px", padding: "0px"}}>
                        <Col>
                            <p style={{ fontSize: "0.8rem" }} className="text-center sign_in_error_message">{errorMessage}</p>
                        </Col>
                    </Row>:""}
                    <Row style={{margin: "0px", padding: "0px"}}>
                        <Col>
                            {store_user_created_success ?
                                <p style={{ fontSize: "0.8rem" }} className="text-center user_created_message_login">{userCreatedMsg}</p> : ""}
                        </Col>
                    </Row>
                </Col>
            </div>
        </div>
    );
}

export default SignIn
