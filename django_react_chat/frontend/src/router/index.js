import renderRoutes from "./renderRoutes";
import routes from "./routerConfig";

const CustomRouter = () =>
  renderRoutes({
    routes: routes,
  });

export default CustomRouter;
