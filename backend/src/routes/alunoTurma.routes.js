const express = require('express');
const router = express.Router();
const alunoTurmaController = require('../controllers/alunoTurma.controller');

// GET /api/aluno-turma - Listar todas as inscrições
router.get('/', alunoTurmaController.getAll);

// GET /api/aluno-turma/:id - Buscar inscrição por ID
router.get('/:id', alunoTurmaController.getById);

// POST /api/aluno-turma - Criar nova inscrição
router.post('/', alunoTurmaController.create);

// PUT /api/aluno-turma/:id - Atualizar inscrição
router.put('/:id', alunoTurmaController.update);

// DELETE /api/aluno-turma/:id - Deletar inscrição
router.delete('/:id', alunoTurmaController.delete);

// GET /api/aluno-turma/aluno/:alunoId - Buscar turmas do aluno
router.get('/aluno/:alunoId', alunoTurmaController.getByAluno);

// GET /api/aluno-turma/turma/:turmaId - Buscar alunos da turma
router.get('/turma/:turmaId', alunoTurmaController.getByTurma);

module.exports = router;
