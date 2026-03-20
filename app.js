import { Router } from "express";
import UserRoutes from "./Routers/AuthRoute.js";
import stafRoutes from "./Routers/staffRoute.js";
import ShopierRoutes from "./Routers/ShopierRoute.js";



const router = Router();

router.use("/api/v1", UserRoutes);
router.use("/api/v1", stafRoutes);
router.use("/api/v1", ShopierRoutes);


export default router;
