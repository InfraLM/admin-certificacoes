const express = require('express');
const router = express.Router();
const financeiroTurmaController = require('../controllers/financeiroTurma.controller');

// Rotas para ci_financeiro_turma
router.get('/', financeiroTurmaController.getAll);
router.get('/turma/:turmaId', financeiroTurmaController.getByTurma);
router.post('/', financeiroTurmaController.create);
router.delete('/:financeiro_id/:turma_id', financeiroTurmaController.delete);

module.exports = router;
