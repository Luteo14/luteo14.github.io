"""Tests d'intégration SQL isolés en mémoire; jamais la D1 de production."""
import sqlite3
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / 'garmin-cloud-worker' / 'migrations'

class D1SchemaTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        for filename in ('002_sport_objectives.sql', '004_training_sessions.sql'):
            self.db.executescript((MIGRATIONS / filename).read_text(encoding='utf-8-sig'))

    def tearDown(self):
        self.db.close()

    def test_sessions_create_update_delete_and_owner_isolation(self):
        sql = 'INSERT INTO sport_training_sessions(owner_email,id,session_date,payload,updated_at) VALUES(?,?,?,?,?)'
        self.db.execute(sql, ('a@test.invalid','s1','2026-11-01','{"km":8}','2026-10-28'))
        self.db.execute(sql, ('b@test.invalid','s1','2026-11-01','{"km":12}','2026-10-28'))
        self.db.execute("UPDATE sport_training_sessions SET payload=? WHERE owner_email=? AND id=?", ('{"km":10}','a@test.invalid','s1'))
        self.assertEqual(self.db.execute("SELECT payload FROM sport_training_sessions WHERE owner_email=?",('a@test.invalid',)).fetchone()[0],'{"km":10}')
        self.assertEqual(self.db.execute("SELECT payload FROM sport_training_sessions WHERE owner_email=?",('b@test.invalid',)).fetchone()[0],'{"km":12}')
        self.db.execute("DELETE FROM sport_training_sessions WHERE owner_email=? AND id=?",('a@test.invalid','s1'))
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM sport_training_sessions').fetchone()[0],1)

    def test_objective_create_update_soft_delete(self):
        sql='INSERT INTO sport_objectives(id,owner_email,payload,updated_at,deleted_at) VALUES(?,?,?,?,NULL)'
        self.db.execute(sql,('obj1','a@test.invalid','{"name":"Marathon"}','2026-10-28'))
        self.db.execute("UPDATE sport_objectives SET payload=?,updated_at=? WHERE id=? AND owner_email=?",('{"name":"Semi"}','2026-10-29','obj1','a@test.invalid'))
        self.assertEqual(self.db.execute('SELECT payload FROM sport_objectives WHERE id=?',('obj1',)).fetchone()[0],'{"name":"Semi"}')
        self.db.execute('UPDATE sport_objectives SET deleted_at=? WHERE id=? AND owner_email=?',('2026-10-30','obj1','a@test.invalid'))
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM sport_objectives WHERE deleted_at IS NULL').fetchone()[0],0)

if __name__=='__main__': unittest.main(verbosity=2)
