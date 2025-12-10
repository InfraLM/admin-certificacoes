const express = require('express');
const router = express.Router();
const alunosController = require('../controllers/alunos.controller');

// GET /api/alunos - Listar todos os alunos
router.get('/', alunosController.getAll);

// GET /api/alunos/:id - Buscar aluno por ID
router.get('/:id', alunosController.getById);

// POST /api/alunos - Criar novo aluno
router.post('/', alunosController.create);

// PUT /api/alunos/:id - Atualizar aluno
router.put('/:id', alunosController.update);

// PATCH /api/alunos/:id - Atualizar campo específico
router.patch('/:id', alunosController.updateField);

// DELETE /api/alunos/:id - Deletar aluno
router.delete('/:id', alunosController.delete);

// GET /api/alunos/status/:status - Buscar por status
router.get('/status/:status', alunosController.getByStatus);

// GET /api/alunos/vendedor/:vendedor - Buscar por vendedor
router.get('/vendedor/:vendedor', alunosController.getByVendedor);

module.exports = router;
