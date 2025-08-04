import MainController from "@controllers/index.controller";
import { createRouter } from "@utils/index";

const router = createRouter();

router.get(`/ack`, (...args) => MainController.ack(...args));

export default router;
