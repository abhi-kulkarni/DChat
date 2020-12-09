import React, {useState, useEffect} from "react";
import {withRouter} from 'react-router-dom';
import axiosInstance from '../components/axiosInstance'
import {useHistory} from 'react-router-dom'
import {user_created_success, spinner_overlay, user_data} from '../redux'
import {useDispatch, useSelector} from "react-redux";
import '../index.css'
import AtomSpinner from '../components/Atomspinner'

function Chat(props) {

    // useEffect(() => {
    // }, [])


    const history = useHistory();
    const dispatch = useDispatch();
    const store_overlay = useSelector(state => state.session.spinner_overlay);
    const curr_user_data = useSelector(state => state.session.user_data);
    const [user, setUser] = useState({});

    const getAllUsers = (e, type, data) => {
        if (store_overlay) {
            spinner(true);
        }
        axiosInstance.get('get_curr_user/').then(res => {
            spinnerStop();
            if(res.data.ok) {
                setUser(res.data.user)
            }else{
                //pass
            }
        }).catch(err => {
            spinnerStop();
            console.log(err)
        });
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
            State {JSON.stringify(curr_user_data)}
        </div>
    )
}

export default withRouter(Chat)
