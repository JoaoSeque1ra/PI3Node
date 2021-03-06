const express = require("express");
const router = express.Router();

const orcamentoController = require('../controller/orcamentoController');

router.get('/listEstados', orcamentoController.estadosServico);

router.get('/listOrcamento', orcamentoController.listOrcamentos);

router.get('/findOrcamento/:id', orcamentoController.getOrcamento);

router.post('/createOrcamento', orcamentoController.createOrcamento);

router.post('/createOrcamentoById', orcamentoController.createOrcamentoNew);

router.post('/updateOrcamento/:id', orcamentoController.updateOrcamento);

router.post('/updateOrcamentoValor/:id', orcamentoController.updateOrcamentoValor);

router.get("/listClients", orcamentoController.listClients);

router.get("/listOrcamentoFromClient/:id", orcamentoController.findOrcamentoFromClient);

router.get("/findClient/:id", orcamentoController.getClients);

router.post('/createClient', orcamentoController.createClient);

router.post('/updateClient/:id', orcamentoController.updateClient);

router.get('/findDescricaoServicos/:id', orcamentoController.listDescricaoServicos);

router.post('/updateDescricaoServicos/:id', orcamentoController.updateDescricaoServicos);


module.exports = router;