import React, {useState, useEffect, useRef} from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import brandImg from '../static/images/brand_img.png'
import {useDispatch, useSelector} from "react-redux";
import {useHistory, Link} from 'react-router-dom'
import '../index.css'
import {spinner_overlay, sign_out, user_data, forgot_password_clicked, notifications, friend_requests, chat_messages, chat_requests} from '../redux'
import AtomSpinner from './Atomspinner'
import axios from 'axios'
import axiosInstance from '../components/axiosInstance'
import defaultImg from '../static/images/default_profile_picture.jpg'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Overlay from 'react-bootstrap/Overlay'
import Popover from 'react-bootstrap/Popover'
import Button from 'react-bootstrap/Button'
import InputGroup from 'react-bootstrap/InputGroup'
import Modal from 'react-bootstrap/Modal'
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import {FaUserPlus, FaEye, FaEyeSlash, FaBell, FaEnvelopeOpen, FaUserShield, FaCheckCircle, FaKey, FaComments, FaAddressBook} from "react-icons/fa";
import CustomBadge from '../components/CustomBadge/badge';
import WebSocketInstance from '../websocket'
import moment from 'moment'

function Header(props) {

    const isLoggedIn = useSelector(state => state.session.isLoggedIn);
    const history = useHistory();
    const dispatch = useDispatch();
    const store_overlay = useSelector(state => state.session.spinner_overlay);
    const curr_user_data = useSelector(state => state.session.user_data);
    const [windowDimensions, setWindowDimensions] = useState({
        'height': window.innerHeight,
        'width': window.innerWidth
    });
    const [notificationCount, setNotificationCount] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationTarget, setNotificationTarget] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isIncorrectPassword, setIsIncorrectPassword] = useState("");
    const [isIncorrectCurrentPassword, setIsIncorrectCurrentPassword] = useState(false);
    const [inCorrectCurrentPasswordMsg, setIncorrectCurrentPasswordMsg] = useState("");
    const [isValidCurrentPassword, setIsValidCurrentPassword] = useState(false);
    const [isValidNewPassword, setisValidNewPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
    const [changePasswordModal, setChangePasswordModalShow] = useState(false);
    const [tabKey, setTabKey] = useState('password');
    const [passwordFormData, setPasswordFormData] = useState({
        currentPassword: "",
        newPassword: "",
        newPasswordConfirm: "",
    });
    const notificationRef = useRef(null);
    const session_notification_data = useSelector(state => state.session.notifications)
    const [formErrors, setFormErrors] = useState({
        currentPassword: "",
        newPassword: "",
        newPasswordConfirm: "",
    });
    const [notificationData, setNotificationData] = useState([]);

    const emailRegex = RegExp(
        /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    );

    const passwordRegex = RegExp(
        /^(?=\S*[a-z])(?=\S*[A-Z])(?=\S*\d)(?=\S*[^\w\s])\S{6,10}$/
    );

    useEffect(() => {
        let count = 0;
        let data = session_notification_data && session_notification_data.filter(item => {
            if(item){
                if(item.hasOwnProperty('read') && !item.read){
                    count += 1
                }
                return item.participants.indexOf(curr_user_data.id) > -1
            }
        })
        setNotificationData(data.reverse());
        count > 0?setNotificationCount(count):setNotificationCount(0);
    }, [session_notification_data])

    const hideNotificationPopUp = () => {
        setShowNotification(false);
    };

    const showNotifications = (event) => {
        let data = session_notification_data && session_notification_data.map(item => {
            if(item){
                item['read'] = true;
                return item;
            }  
        });
        setNotificationData(data);
        manageNotifications(data);
        setNotificationCount(0)
        setShowNotification(!showNotification);
        setNotificationTarget(event.target);
    };


    const manageNotifications = (notification_data) => {

        let post_data = {};
        post_data['notifications'] = notification_data
        post_data['type'] = 'edit';
        axiosInstance.post('manage_notifications/', post_data).then(res => {
          if(res.data.ok) {
              dispatch(notifications(res.data.notifications, "read"));

          }else{
              console.log('Error')
          }
        }).catch(err => {
            console.log(err)
        });
        
      }

    const spinner = (display) => {
        let overlay_ele = document.getElementById("overlay")
        overlay_ele && display ? overlay_ele.style.display = "block" : overlay_ele.style.display = "none";
    };

    const initializeSocket = () => {
        waitForSocketConnection(() => {
          WebSocketInstance.fetchFriendRequests(
            curr_user_data.id
          );
        });
        WebSocketInstance.connect('friend_requests', '');
    }

    const spinnerStop = () => {
        dispatch(spinner_overlay(false));
        spinner(false);
    };

    const passwordVisibilityToggle = (id, reset, type) => {
        if (reset) {
            if (type === "new") {
                let new_password = !showNewPassword;
                setShowNewPassword(new_password);
            } else {
                let new_password_confirm = !showNewPasswordConfirm;
                setShowNewPasswordConfirm(new_password_confirm);
            }
        } else {
            let current_password = !showCurrentPassword;
            setShowCurrentPassword(current_password);
        }
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

    const changePassword = () => {

        if (formValid(formErrors, passwordFormData, "password")) {
            setisValidNewPassword(true);
            closeChangePasswordModal();
            if(store_overlay) {
                spinner(true)
            }
            let post_data = {};
            post_data['password'] = passwordFormData.newPassword
            axiosInstance.post('change_password/', post_data).then(res => {
                spinnerStop();
                if (res.data.ok) {
                    console.log(`
                        --SUBMITTING--
                        Reset Password: ${passwordFormData.newPassword}
                        Password: ${passwordFormData.newPasswordConfirm}
                    `);
                    signout();
                } else {
                    console.log('error')
                }
            }).catch(err => {
                spinnerStop();
                console.log('Error')
            });
        } else {
            setisValidNewPassword(false);
            setFormErrors({...formErrors, newPassword: ""});
            setFormErrors({...formErrors, newPasswordConfirm: ""});
            setIsIncorrectPassword(true);
            console.error("FORM INVALID - DISPLAY ERROR MESSAGE");
        }
    };

    const handleChange = e => {

        e.preventDefault();

        const {name, value} = e.target;
        let password = passwordFormData.newPassword;
        if (tabKey == 'change_password') {
            let new_password = document.getElementById('newPassword').value;
            let new_password_confirm = document.getElementById('newPasswordConfirm').value;
            if (new_password !== new_password_confirm && new_password.length > 0 && new_password_confirm.length > 0) {
                formErrors.newPasswordConfirm = "password and confirm password should be the same";
            } else {
                formErrors.newPasswordConfirm = "";
            }
        }
        validate(name, value, password);
    };

    const validate = (name, value, password) => {
        setIncorrectCurrentPasswordMsg("");
        switch (name) {
            case "currentPassword":
                setPasswordFormData({...setPasswordFormData, currentPassword: value});
                if (passwordRegex.test(value)) {
                    setFormErrors({...formErrors, currentPassword: ""})
                } else if (value.length == 0) {
                    setFormErrors({...formErrors, currentPassword: "password field is required"})
                }else {
                    if (value.length > 0) {
                        setFormErrors({
                            ...formErrors,
                            currentPassword: "password must contain minimum 6 and maximum 10 characters, at least one uppercase letter, one lowercase letter, one number and one special character"
                        })
                    } else {
                        setFormErrors({...formErrors, currentPassword: ""})
                    }
                }
                break;
            case "newPassword":
                setIsIncorrectPassword(false);
                setPasswordFormData({...passwordFormData, newPassword: value});
                if (passwordRegex.test(value)) {
                    setFormErrors({...formErrors, newPassword: ""})
                } else if (value.length == 0) {
                    setFormErrors({...formErrors, newPassword: "password field is required"})
                }else {
                    if (value.length > 0) {
                        setFormErrors({
                            ...formErrors,
                            newPassword: "password must contain minimum 6 and maximum 10 characters, at least one uppercase letter, one lowercase letter, one number and one special character"
                        })
                    } else {
                        setFormErrors({...formErrors, newPassword: ""})
                    }
                }
                break;
            case "newPasswordConfirm":
                setPasswordFormData({...passwordFormData, newPasswordConfirm: value});
                if (value.length > 0 && value !== password) {
                    setFormErrors({
                        ...formErrors,
                        newPasswordConfirm: "password and confirm password should be the same"
                    })
                } else if (value.length == 0) {
                    setFormErrors({...formErrors, newPasswordConfirm: "confirm password field is required"})
                } else {
                    setIsIncorrectPassword(false);
                    setFormErrors({...formErrors, newPasswordConfirm: ""})
                }
                break;
            default:
                break;
        }
    };

    const openChangePasswordModal = () => {
        setIsValidCurrentPassword(false);
        setTabKey("password");
        setChangePasswordModalShow(true);
        setFormErrors({
           ...formErrors, currentPassword: ""
        });
        setIncorrectCurrentPasswordMsg("");
        setPasswordFormData({
            newPassword: "",
            newPasswordConfirm: ""
        });
        setPasswordFormData({currentPassword: ""});
    };

    const closeChangePasswordModal = () => {
        setChangePasswordModalShow(false);
        spinnerStop();
    };

    const validatePassword = () => {
        
        if (store_overlay) {
            spinner(true);
        }
        let post_data = {};
        if (formValid(formErrors, passwordFormData, "currentPassword")) {
            post_data['password'] = passwordFormData.currentPassword;
            axiosInstance.post('validate_password/', post_data).then(res => {
                spinnerStop();
                if (res.data.ok) {
                    setIsValidCurrentPassword(true);
                    setTabKey("change_password");
                } else {
                    setIsValidCurrentPassword(false);
                    setFormErrors({...formErrors, currentPassword: ""});
                    setIsIncorrectCurrentPassword(true);
                    setIncorrectCurrentPasswordMsg("You have entered incorrect password.");
                }
            }).catch(err => {
                spinnerStop();
                setIsValidCurrentPassword(false);
                setFormErrors({...formErrors, currentPassword: ""});
                setIsIncorrectCurrentPassword(true);
                setIncorrectCurrentPasswordMsg("You have entered incorrect password.");
            });
            console.log('VALID')
        } else {
            setIsValidCurrentPassword(false);
            setFormErrors({...formErrors, currentPassword: ""});
            setIsIncorrectCurrentPassword(true);
            setIncorrectCurrentPasswordMsg("You have entered incorrect password.");
            console.error("FORM INVALID - DISPLAY ERROR MESSAGE");
        }
    };

    const signout = () => {

        if(store_overlay) {
            spinner(true)
        }
        axiosInstance.get('signout/').then(response => {
                spinnerStop();
                if (response.data.ok) {
                    dispatch(sign_out());
                    dispatch(user_data());
                    dispatch(friend_requests());
                    dispatch(chat_requests());
                    dispatch(chat_messages());
                    dispatch(notifications());
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    history.push('/signin')
                } else {
                    console.log("Error")
                }
            }).catch(error => {
                spinnerStop();
                console.log(error)
        });
    };

    const goToForgotPassword = () => {
        dispatch(forgot_password_clicked());
        signout();
    }
    
    return (
        <div className="fixed-top" style={{padding: '0%', margin: '0%'}}>
            <div id="overlay">
                <AtomSpinner/>
            </div>
            <Modal
                show={changePasswordModal} onHide={closeChangePasswordModal}
                size="md"
                backdrop="static"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header style={{padding: "2%"}}>
                    <Modal.Title id="contained-modal-title-vcenter">
                    <span style={{fontSize: "1.2rem"}}>Change Password</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{paddingTop: '0px', paddingLeft: '0px', paddingRight: '0px'}}>
                <Tabs
                    className="nav-justified"
                    id="reset_password_tabs"
                    activeKey={tabKey}
                    onSelect={(k) => setTabKey(k)}
                    >
                    <Tab eventKey="password" title={<span style={{color: tabKey === "password" ? "#007BFF" : ""}}><FaKey
                                 style={{ marginBottom: "5px", marginRight: "15px", color: "#007BFF"}}/>Current Password</span>}>
                       <Row style={{margin: "0px", padding: "0px"}}>
                                <Col sm={12} xs={12} md={12} style={{marginTop: "2%"}}>
                                    <Form style={{marginTop: "20px"}}>
                                        <Form.Group controlId="currentPassword">
                                            <InputGroup>
                                                <Form.Control name="currentPassword"
                                                              type={showCurrentPassword ? "text" : "password"}
                                                              value={passwordFormData.currentPassword}
                                                              onChange={e => handleChange(e)}
                                                              placeholder="Enter Current Password">

                                                </Form.Control>
                                                <InputGroup.Append>
                                                    <InputGroup.Text className="cursor-pointer"
                                                                     onClick={() => passwordVisibilityToggle("current_password", false, "")}>
                                                        {showCurrentPassword ? <FaEye style={{color: "#007BFF"}}/> :
                                                            <FaEyeSlash style={{color: "#007BFF"}}/>}
                                                    </InputGroup.Text>
                                                </InputGroup.Append>
                                            </InputGroup>
                                            <Row style={{'margin': '0px', 'padding': '0px'}}>
                                                <Col style={{ 'paddingRight': '1%' }} xs={{ span: '6', offset: '6' }} sm={{ span: '5', offset: '7' }} md={{ span: '4', offset: '8' }} lg={{ span: '4', offset: '8' }} xl={{ span: '4', offset: '8' }}>
                                                    <p onClick={() => goToForgotPassword()} style={{'color': '#0879FA', 'textDecoration': 'none'}} className="cursor-pointer forgot-password text-right">
                                                        Forgot password ?
                                                    </p>
                                                </Col>
                                            </Row>
                                            <Row style={{margin: "8px 0px 0px 0px", padding: "0px"}}>
                                                <Col sm={12} xs={12} md={12} style={{padding: "0px"}}>
                                                    {isValidCurrentPassword && tabKey == "password" ?
                                                    <span className="validate_email_message">Password has been verified ! <FaCheckCircle
                                                        style={{
                                                            marginBottom: "3px",
                                                            marginLeft: "10px",
                                                            color: "green"
                                                        }}/></span> : ""}
                                                    {isIncorrectCurrentPassword && formErrors.currentPassword.length <= 0 ?
                                                        <span className="errorMessage">{inCorrectCurrentPasswordMsg}</span> : ""}
                                                </Col>
                                            </Row>
                                        </Form.Group>
                                    </Form>
                                </Col>
                            </Row>
                    </Tab>
                    <Tab disabled eventKey="change_password" title={<span style={{color: tabKey == "change_password" ? "#228B22" : ""}}><FaUserShield style={{
                                 marginBottom: "5px",
                                 marginRight: "15px",
                                 color: isValidCurrentPassword ? "#228B22" : "gray"
                             }}/>Change Password</span>}>
                        <Row style={{margin: "0px", padding: "0px"}}>
                                <Col sm={12} xs={12} md={12} style={{marginTop: "2%"}}>
                                    <Form style={{marginTop: "20px"}}>
                                        <Form.Group controlId="newPassword">
                                            <InputGroup>
                                                <Form.Control name="newPassword"
                                                              type={showNewPassword ? "text" : "password"}
                                                              value={passwordFormData.showNewPassword}
                                                              onChange={e => handleChange(e)}
                                                              placeholder="Enter New Password">

                                                </Form.Control>
                                                <InputGroup.Append>
                                                    <InputGroup.Text className="cursor-pointer"
                                                                     onClick={() => passwordVisibilityToggle("new_password", true, "new")}>
                                                        {showNewPassword ? <FaEye style={{color: "#007BFF"}}/> :
                                                            <FaEyeSlash style={{color: "#007BFF"}}/>}
                                                    </InputGroup.Text>
                                                </InputGroup.Append>
                                            </InputGroup>
                                            <Row style={{margin: "8px 0px 0px 0px", padding: "0px"}}>
                                                <Col sm={12} xs={12} md={12} style={{padding: "0px"}}>
                                                    {formErrors.newPassword.length > 0 && (
                                                        <span
                                                            className="float-left errorMessage">{formErrors.newPassword}</span>
                                                    )}
                                                </Col>
                                            </Row>
                                        </Form.Group>
                                        <Form.Group controlId="newPasswordConfirm">
                                            <InputGroup>
                                                <Form.Control name="newPasswordConfirm"
                                                              type={showNewPasswordConfirm ? "text" : "password"}
                                                              value={passwordFormData.newPasswordConfirm}
                                                              onChange={e => handleChange(e)}
                                                              placeholder="Confirm Password">

                                                </Form.Control>
                                                <InputGroup.Append>
                                                    <InputGroup.Text className="cursor-pointer"
                                                                     onClick={() => passwordVisibilityToggle("new_password_confirm", true, "confirm")}>
                                                        {showNewPasswordConfirm ?
                                                            <FaEye style={{color: "#007BFF"}}/> :
                                                            <FaEyeSlash style={{color: "#007BFF"}}/>}
                                                    </InputGroup.Text>
                                                </InputGroup.Append>
                                            </InputGroup>
                                            <Row style={{margin: "8px 0px 0px 0px", padding: "0px"}}>
                                                <Col sm={12} xs={12} md={12} style={{padding: "0px"}}>
                                                    {formErrors.newPasswordConfirm.length > 0 && formErrors.newPassword.length <= 0 && (
                                                        <span
                                                            className="float-left errorMessage">{formErrors.newPasswordConfirm}</span>
                                                    )}
                                                </Col>
                                            </Row>
                                            <Row style={{margin: "8px 0px 0px 0px", padding: "0px"}}>
                                                <Col sm={12} xs={12} md={12}>{isIncorrectPassword && (formErrors.newPassword.length <= 0 || formErrors.newPasswordConfirm.length <= 0) ?
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
                        <Col style={{ padding:"0px" }} xs={{ span: ((tabKey === "password" && !isValidCurrentPassword) || (tabKey === "change_password" && isValidCurrentPassword)) ? 8:4 }} sm={{ span: ((tabKey === "password" && !isValidCurrentPassword) || (tabKey === "change_password" && isValidCurrentPassword)) ? 8:4 }} md={{ span: ((tabKey === "password" && !isValidCurrentPassword) || (tabKey === "change_password" && isValidCurrentPassword)) ? 8:4 }} lg={{ span: ((tabKey === "password" && !isValidCurrentPassword) || (tabKey === "change_password" && isValidCurrentPassword)) ? 8:4 }} xl={{ span: ((tabKey === "password" && !isValidCurrentPassword) || (tabKey === "change_password" && isValidCurrentPassword)) ? 8:4 }}>
                            {isValidCurrentPassword && tabKey === "password" ? <OverlayTrigger
                        key="bottom"
                        placement="top"
                        overlay={
                            <Tooltip id="password_change_tooltip">
                                <span>Reset your password on the next tab.</span>
                            </Tooltip>
                        }
                    ><FaUserShield onClick={() => setTabKey("change_password")} size="20px" style={{
                        cursor: "pointer",
                        color: "#007BFF"
                    }}/></OverlayTrigger> : ""}
                    {isValidCurrentPassword && tabKey === "password" ? "" : <Button className="float-right" size="sm"
                                                                        onClick={tabKey === 'password' ? () => validatePassword() : () => changePassword()}
                                                                        type="submit">{tabKey === 'password' ? 'Validate Password' : 'Change Password'}</Button>}
                        </Col>
                        <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                            <Button className="float-left" size="sm" variant="danger" onClick={() => closeChangePasswordModal()}>Close</Button>
                        </Col>
                    </Row>
                </Modal.Footer>
            </Modal>
            <Navbar collapseOnSelect expand="lg" bg="light">
                <Navbar.Brand href={isLoggedIn?'/home': '/'}>
                <img
                    alt="Brand Image"
                    src={brandImg}
                    width="40"
                    height="35"
                    className="img-fluid d-inline-block align-top"
                />{' '}
                <span style={{ 'padding': '5%', fontSize: '1.1rem', color: 'gray' }}>Neutrino.io</span>
                </Navbar.Brand>
                    <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                        <Navbar.Collapse id="responsive-navbar-nav">
                            {isLoggedIn?
                            <Nav className="ml-auto">
                                <Nav.Link style={{ position: 'relative', paddingTop: '10px', paddingRight: '20px', paddingLeft: '5px' }}>
                                    <FaBell onClick={showNotifications} style={{ cursor: 'pointer', fontSize: '1.3rem' }}/>
                                    <CustomBadge style={{
                                        fontSize: '0.7rem',
                                        padding: '3px 6px',
                                        right: notificationCount > 10 ? '-12px' : '-5px'
                                    }} count={notificationCount}/>
                                    <Overlay
                                        show={showNotification}
                                        onHide={hideNotificationPopUp}
                                        rootClose={true}
                                        target={notificationTarget}
                                        placement="bottom"
                                        container={notificationRef.current}
                                        containerPadding={20}
                                    >
                                        <Popover id="notification_popover">
                                            <Popover.Title as="h3" style={{
                                                color: 'black',
                                                fontWeight: 'bold',
                                                'paddingLeft': '20%',
                                                fontSize: '12px'
                                            }}>Notifications</Popover.Title>
                                            <Popover.Content>
                                            {notificationData.length > 0?notificationData.map(item => {
                                                return (<Row style={{margin: '0px', padding: '0px'}}>
                                                    <Col style={{ padding: '0px' }} xs={1} sm={1} md={1} lg={1} xl={1}>
                                                        {item.notification_type =='chat'?<FaComments style={{ fontSize: '0.8rem', margin: '0px', color: '#5C8DF2' }}/>:<FaUserPlus style={{ fontSize: '0.8rem', margin: '0px', color: '#58A847' }}/>}
                                                    </Col>
                                                    <Col style={{ padding: '2px 0px 0px 5px'}} xs={11} sm={11} md={11} lg={11} xl={11}>
                                                        <p style={{margin: '0px', fontSize:'0.8rem', color: '#6393F2'}}>{item.message}</p>
                                                        <p style={{margin: '0px', fontSize:'0.6rem', fontWeight: 'bold'}} className="float-right">{moment(item.created_on).fromNow()}</p>
                                                    </Col>                                                    
                                                </Row>)
                                            }):<div>
                                                <p style={{margin: '0px', textAlign:'center'}}>No new notifications.</p>
                                                </div>}
                                            </Popover.Content>
                                        </Popover>
                                    </Overlay>
                                </Nav.Link>
                                <Nav.Link style={{ paddingTop: '10px', paddingRight: '20px', paddingLeft: '5px' }} href="/friends">
                                    <FaAddressBook style={{ cursor: 'pointer', fontSize: '1.3rem' }} />
                                </Nav.Link>
                                <Nav.Link style={{ paddingTop: '10px', paddingRight: '30px', paddingLeft: '5px' }} href="/chat">
                                    <FaComments style={{ cursor: 'pointer', fontSize: '1.6rem' }} />
                                </Nav.Link>
                                <DropdownButton
                                    alignRight
                                    title={<img
                                        style={{margin: "0px 0px 0px 0px", width: "40px", height: "40px", borderRadius: "50%"}}
                                        src={curr_user_data.profile_picture ? curr_user_data.profile_picture : defaultImg}
                                        alt="profile_img"/>}
                                        id="dropdown-menu-align-right"
                                >
                                    <Dropdown.Item>
                                        <span style={{color: "black", textDecoration: 'none'}}>
                                            Username : <b>{curr_user_data.username}</b>
                                        </span>
                                    </Dropdown.Item>
                                    <Dropdown.Item><Link style={{color: "black", textDecoration: 'none'}} to='/profile'>Your
                                        Profile</Link></Dropdown.Item>
                                    <Dropdown.Item><Link style={{color: "black", textDecoration: 'none'}} to='/friends'>
                                    Manage Friends</Link></Dropdown.Item>    
                                    <Dropdown.Item onClick={() => openChangePasswordModal()}>
                                        Change Password
                                    </Dropdown.Item>
                                    <Dropdown.Divider/>
                                    <Dropdown.Item onClick={() => signout()}>Logout</Dropdown.Item>
                                </DropdownButton>
                            </Nav>:
                            <Nav className="ml-auto">
                                <Nav.Link href="/signin">Sign In</Nav.Link>
                                <Nav.Link  href="/signup">Sign Up</Nav.Link>
                            </Nav>
                            }
                    </Navbar.Collapse>
                </Navbar>
        </div>
    );
}

export default Header
