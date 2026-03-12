const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function callPythonApi(endpoint, body) {
  const response = await fetch(`${PYTHON_API}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Python API error: ${response.status}`);
  return response.json();
}
