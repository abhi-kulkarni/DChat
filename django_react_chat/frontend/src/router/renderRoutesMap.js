import React from "react";
import AuthRoute from './authRoute'

const renderRoutesMap = (routes) =>
    (routes.map((route, i) => {
    return <AuthRoute key={i} exact={route.exact}
                      path={route.path} auth={!!route.layout} layout={route.layout} component={route.component} >
            </AuthRoute>
        })
    );

export default renderRoutesMap

