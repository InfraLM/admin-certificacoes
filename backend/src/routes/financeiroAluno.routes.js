const express = require('express');
const router = express.Router();
const financeiroAlunoController = require('../controllers/financeiroAluno.controller');

// Rotas para ci_financeiro_aluno
router.get('/', financeiroAlunoController.getAll);
router.get('/aluno/:alunoId', financeiroAlunoController.getByAluno);
router.get('/turma/:turmaId', financeiroAlunoController.getByTurma);
router.post('/', financeiroAlunoController.create);
router.delete('/:aluno_id/:financeiro_id', financeiroAlunoController.delete);

module.exports = router;
