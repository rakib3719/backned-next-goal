import { Router } from "express";
import { createSession } from "../controller/PaymentController.js";
import { adminOverview, adminPaymetsHistory, adminStatisticsOverview, getStatisticsData, latestPayments, latestPaymentsAll, userOverview, userPaymetsHistory } from "../controller/PaymentHistoryController.js";


const router = Router();


router.post('/createLink', createSession);
router.get('/overview/:email', userOverview);
router.get('/statistics/:email', getStatisticsData);
router.get('/latest-payment/:email', latestPayments);
router.get('/all-payment-history/:email', userPaymetsHistory);
router.get('/admin-overview' , adminOverview);
router.get('/latestPayments', latestPaymentsAll);
router.get('/admin-allPaymentsHistory', adminPaymetsHistory);
router.get('/admin-statistics', adminStatisticsOverview)


export default router;