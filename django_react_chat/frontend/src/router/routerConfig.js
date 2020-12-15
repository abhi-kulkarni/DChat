import SignIn from "../pages/Signin"
import SignUp from "../pages/Signup";
import Home from "../pages/Home";
import Chat from "../pages/Chat";
import Friends from "../pages/Friends";
import ChangePassword from "../pages/ChangePassword";
import Profile from "../pages/Profile";

import CustomLayout from "../layouts/Layout";

const routes = [{
    path: "/",
    component: SignIn,
    layout: CustomLayout,
    exact: true,
}, {
    path: "/signin",
    component: SignIn,
    layout: CustomLayout,
    exact: true,
    name: 'login'
}, {
    path: "/signup",
    component: SignUp,
    layout: CustomLayout,
    exact: true,
    name: 'signup'
},{
    path: "/home",
    component: Home,
    layout: CustomLayout,
    exact: true,
    name: 'home'
},{
    path: "/profile",
    component: Profile,
    layout: CustomLayout,
    exact: true,
    name: 'profile'
},
{
    path: "/chat",
    component: Chat,
    layout: CustomLayout,
    exact: true,
    name: 'chat'
},{
    path: "/change_password",
    component: ChangePassword,
    layout: CustomLayout,
    exact: true,
    name: 'change_password'
},
{
    path: "/friends",
    component: Friends,
    layout: CustomLayout,
    exact: true,
    name: 'friends'
}
];

export default routes
