// scripts/seed.ts
import 'dotenv/config';
import pool from '../src/lib/db';
import { hash } from 'bcrypt';

async function main() {
  const connection = await pool.getConnection();
  console.log('Conectado ao banco de dados.');

  try {
    await connection.beginTransaction();
    console.log('Iniciando transação...');

    // Limpar tabelas na ordem correta para evitar problemas de chave estrangeira
    console.log('Limpando tabelas existentes...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('TRUNCATE TABLE horarios_trabalho;');
    await connection.query('TRUNCATE TABLE folgas;');
    await connection.query('TRUNCATE TABLE financeiro;');
    await connection.query('TRUNCATE TABLE agendamentos_pendentes;');
    await connection.query('TRUNCATE TABLE agendamentos;');
    await connection.query('TRUNCATE TABLE servicos;');
    await connection.query('TRUNCATE TABLE funcionarios;');
    await connection.query('TRUNCATE TABLE funcoes;');
    await connection.query('TRUNCATE TABLE clientes;');
    await connection.query('TRUNCATE TABLE configuracoes;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Tabelas limpas.');

    // Seed Funções (Roles)
    console.log('Populando tabela `funcoes`...');
    const roles = [
      { id: 'role-1', name: 'Barbeiro' },
      { id: 'role-2', name: 'Manicure' },
      { id: 'role-3', name: 'Cabeleireiro(a)' },
    ];
    for (const role of roles) {
      await connection.query('INSERT INTO funcoes (id, name) VALUES (?, ?)', [role.id, role.name]);
    }
    console.log('Tabela `funcoes` populada.');

    // Seed Funcionários (Staff)
    console.log('Populando tabela `funcionarios`...');
    const funcionarios = [
      { id: 'func-1', name: 'Carlos Almeida', roleId: 'role-1', avatarUrl: 'https://picsum.photos/seed/5/112/112', salesTarget: 3000 },
      { id: 'func-2', name: 'Beatriz Costa', roleId: 'role-2', avatarUrl: 'https://picsum.photos/seed/6/112/112', salesTarget: 2500 },
      { id: 'func-3', name: 'Mariana Silva', roleId: 'role-3', avatarUrl: 'https://picsum.photos/seed/7/112/112', salesTarget: 4000 },
      { id: 'func-4', name: 'Ricardo Mendes', roleId: 'role-1', avatarUrl: 'https://picsum.photos/seed/8/112/112', salesTarget: 3200 },
    ];
    for (const func of funcionarios) {
      await connection.query(
        'INSERT INTO funcionarios (id, name, roleId, avatarUrl, salesTarget, salesValue, salesGoalPercentage) VALUES (?, ?, ?, ?, ?, 0, 0)',
        [func.id, func.name, func.roleId, func.avatarUrl, func.salesTarget]
      );
    }
    console.log('Tabela `funcionarios` populada.');

    // Seed Serviços (Services)
    console.log('Populando tabela `servicos`...');
    const services = [
      { id: 'serv-1', name: 'Corte Social', price: 35.0, duration: 30, roleId: 'role-1' },
      { id: 'serv-2', name: 'Barba Terapia', price: 40.0, duration: 45, roleId: 'role-1' },
      { id: 'serv-3', name: 'Pé e Mão', price: 50.0, duration: 60, roleId: 'role-2' },
      { id: 'serv-4', name: 'Escova Progressiva', price: 150.0, duration: 120, roleId: 'role-3' },
      { id: 'serv-5', name: 'Hidratação Capilar', price: 80.0, duration: 60, roleId: 'role-3' },
    ];
    for (const service of services) {
      await connection.query('INSERT INTO servicos (id, name, price, duration, roleId) VALUES (?, ?, ?, ?, ?)', [
        service.id,
        service.name,
        service.price,
        service.duration,
        service.roleId,
      ]);
    }
    console.log('Tabela `servicos` populada.');
    
    // Seed Clientes
    console.log('Populando tabela `clientes`...');
    const clients = [
        {id: 'client-1', name: 'João Pereira', whatsapp: '11987654321'},
        {id: 'client-2', name: 'Ana Souza', whatsapp: '21912345678'},
    ];
    for(const client of clients) {
        await connection.query('INSERT INTO clientes (id, name, whatsapp) VALUES (?, ?, ?)', [client.id, client.name, client.whatsapp]);
    }
    console.log('Tabela `clientes` populada.');


    // Seed Configurações
    console.log('Populando tabela `configuracoes`...');
    await connection.query("INSERT INTO configuracoes (id, manualSelection, webhook) VALUES ('settings', ?, ?)", [false, '']);
    console.log('Tabela `configuracoes` populada.');

    await connection.commit();
    console.log('Transação concluída com sucesso. Dados inseridos.');
  } catch (error) {
    await connection.rollback();
    console.error('Erro durante o seeding do banco de dados:', error);
    process.exit(1);
  } finally {
    connection.release();
    console.log('Conexão com o banco de dados liberada.');
    await pool.end();
    console.log('Pool de conexões encerrado.');
  }
}

main();
