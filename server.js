let pg = require("pg");
let express = require("express");
let client = new pg.Client(
  process.env.DATABASE_URL ||
    "postgres://localhost/acme_employees_departments_db"
);
let app = express();

let init = async () => {
  await client.connect();
  let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    
    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
    );
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
    );
  `;
  await client.query(SQL);
  SQL = `
        INSERT INTO departments(name) VALUES('Research');
        INSERT INTO departments(name) VALUES('Collaboration');
        INSERT INTO departments(name) VALUES('Engineering');
        INSERT INTO employees(name, department_id) VALUES('Adam Park', (SELECT id FROM departments WHERE name='Research'));
        INSERT INTO employees(name, department_id) VALUES('Mason Point', (SELECT id FROM departments WHERE name='Research'));
        INSERT INTO employees(name, department_id) VALUES('Claire Market', (SELECT id FROM departments WHERE name='Collaboration'));
        INSERT INTO employees(name, department_id) VALUES('Harrison Valley', (SELECT id FROM departments WHERE name='Collaboration'));
        INSERT INTO employees(name, department_id) VALUES('Benjamin Bridge', (SELECT id FROM departments WHERE name='Engineering'));
        INSERT INTO employees(name, department_id) VALUES('Stella Island', (SELECT id FROM departments WHERE name='Engineering'));
        `;
  await client.query(SQL);

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();

app.use(express.json());
app.use(require("morgan")("dev"));
app.get("/api/departments", async (req, res, next) => {
  try {
    let SQL = `
        SELECT * FROM departments;
    `;
    let response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
app.get("/api/employees", async (req, res, next) => {
  try {
    let SQL = `
          SELECT * FROM employees;
      `;
    let response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
app.post("/api/employees", async (req, res, next) => {
  try {
    let SQL = `
              INSERT INTO employees (name, department_id) VALUES ($1, $2) RETURNING *;
          `;
    let response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
app.put("/api/employees/:id", async (req, res, next) => {
  try {
    let SQL = `
                  UPDATE employees SET name=$1, department_id=$2, updated_at=now() WHERE id=$3 RETURNING *;
              `;
    let response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    let SQL = `
                      DELETE FROM employees WHERE id=$1;
                  `;
    let response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});
