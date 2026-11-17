import { neon } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';

export default async function Page() {
  async function create(formData: FormData) {
    'use server';
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl.includes('***') || dbUrl.includes('localhost')) {
      throw new Error(
        'Please configure your real unmasked Neon DATABASE_URL in .env (currently it has asterisks or localhost).'
      );
    }

    const sql = neon(dbUrl);
    const comment = formData.get('comment');

    await sql`CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

    await sql`INSERT INTO comments (comment) VALUES (${comment?.toString() ?? ''})`;

    revalidatePath('/comments');
  }

  let comments: any[] = [];
  let dbError: string | null = null;
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && !dbUrl.includes('***') && !dbUrl.includes('localhost')) {
    try {
      const sql = neon(dbUrl);
      await sql`CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`;
      comments = await sql`SELECT * FROM comments ORDER BY id DESC LIMIT 10`;
    } catch (err: any) {
      dbError = err.message;
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#111827' }}>
        Neon Server Action Form
      </h1>
      <p style={{ color: '#4B5563', fontSize: 14, marginBottom: 20 }}>
        Type a comment below to insert it into your Neon PostgreSQL database.
      </p>

      {(!dbUrl || dbUrl.includes('***')) && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#B45309', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          ⚠️ <strong>সতর্কতা (Action Required):</strong> আপনার <code>.env</code> ফাইলে <code>DATABASE_URL</code>-এ তারকাচিহ্ন (<code>************</code>) রয়েছে। Neon ড্যাশবোর্ড থেকে পাসওয়ার্ড আনহাইড (Show password) করে আসল কানেকশন স্ট্রিংটি পেস্ট করুন।
        </div>
      )}

      {dbError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          ❌ <strong>Database Connection Error:</strong> {dbError}
        </div>
      )}

      <form action={create} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <input
          type="text"
          placeholder="write a comment"
          name="comment"
          required
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid #D1D5DB',
            borderRadius: 6,
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            background: '#059669',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Submit
        </button>
      </form>

      {comments.length > 0 && (
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
            Recent Comments in Neon Database:
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comments.map((c: any) => (
              <li
                key={c.id}
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#1F2937', fontWeight: 500 }}>{c.comment}</span>
                <span style={{ color: '#9CA3AF', fontSize: 12 }}>#{c.id}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
