import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAsgardeo } from '@asgardeo/react';

const Body = () => {
  const auth = useAsgardeo();

  const [accessToken, setAccessToken] = useState('');
  const [puppies, setPuppies] = useState([]);
  const [form, setForm] = useState({ name: '', breed: '', age: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth?.isSignedIn) return;

    let cancelled = false;

    (async () => {
      try {
        const token = await auth.getAccessToken();
        if (!cancelled) {
          setAccessToken(token);
        }
      } catch (err) {
        console.error('Could not get access token:', err);
        if (!cancelled) {
          setError('Could not get access token');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth]);

  const getAuthHeaders = useCallback(() => {
    if (!accessToken) return {};
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }, [accessToken]);

  const fetchPuppies = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/puppies`, {
        headers: getAuthHeaders(),
      });
      setPuppies(res.data);
      setError('');
    } catch (err) {
      console.error('Fetch puppies error:', err.response?.data || err.message);
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to fetch puppies');
    } finally {
      setLoading(false);
    }
  }, [accessToken, getAuthHeaders]);

  useEffect(() => {
    fetchPuppies();
  }, [fetchPuppies]);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!form.name || !form.breed || !form.age) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/puppies`,
        {
          name: form.name,
          breed: form.breed,
          age: Number(form.age),
        },
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );

      setForm({ name: '', breed: '', age: '' });
      fetchPuppies();
    } catch (err) {
      console.error('Add puppy error:', err.response?.data || err.message);
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to add puppy');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/puppies/${editingId}`,
        {
          name: form.name,
          breed: form.breed,
          age: Number(form.age),
        },
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );

      setEditingId(null);
      setForm({ name: '', breed: '', age: '' });
      fetchPuppies();
    } catch (err) {
      console.error('Update puppy error:', err.response?.data || err.message);
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to update puppy');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this puppy?')) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/puppies/${id}`, {
        headers: getAuthHeaders(),
      });
      fetchPuppies();
    } catch (err) {
      console.error('Delete puppy error:', err.response?.data || err.message);
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to delete puppy');
    }
  };

  const handleEdit = (puppy) => {
    setEditingId(puppy.id);
    setForm({
      name: puppy.name,
      breed: puppy.breed,
      age: puppy.age,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: '', breed: '', age: '' });
    setError('');
  };

  if (!auth?.isSignedIn) {
    return (
      <main className="puppy-main">
        <h2 className="puppy-title">Puppies Table</h2>
        <div className="puppy-error">Please sign in first.</div>
      </main>
    );
  }

  return (
    <main className="puppy-main">
      <h2 className="puppy-title">My Puppies</h2>

      {error && <div className="puppy-error">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="puppy-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Breed</th>
              <th>Age</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {puppies.map((puppy) => (
              <tr key={puppy.id}>
                <td>{puppy.name}</td>
                <td>{puppy.breed}</td>
                <td>{puppy.age}</td>
                <td>
                  <button className="puppy-edit-btn" onClick={() => handleEdit(puppy)}>
                    Edit
                  </button>
                  <button className="puppy-delete-btn" onClick={() => handleDelete(puppy.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="puppy-form-title">{editingId ? 'Edit Puppy' : 'Add Puppy'}</h3>

      <form className="puppy-form" onSubmit={editingId ? handleUpdate : handleAdd}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="breed"
          placeholder="Breed"
          value={form.breed}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="age"
          placeholder="Age"
          value={form.age}
          onChange={handleChange}
          required
        />

        <button type="submit">{editingId ? 'Update' : 'Add'}</button>

        {editingId && (
          <button type="button" className="puppy-cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        )}
      </form>
    </main>
  );
};

export default Body;

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { useAsgardeo } from '@asgardeo/react';

// const Body = () => {
//         const [puppies, setPuppies] = useState([]);
//         const [form, setForm] = useState({ name: '', breed: '', age: '', user_id: '' });
//         const [editingId, setEditingId] = useState(null);
//         const [loading, setLoading] = useState(false);
//         const [error, setError] = useState('');

//         const fetchPuppies = async () => {
//         setLoading(true);
//         try {
//         const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/puppies`);
//         setPuppies(res.data);
//         setError('');
//         } catch (err) {
//         setError('Failed to fetch puppies');
//         }
//         setLoading(false);
//         };

//         useEffect(() => {
//           (async () => {
//             await fetchPuppies();
//           })();
//         }, []);

//         const handleAdd = async (e) => {
//           e.preventDefault();
//           if (!form.name || !form.breed || !form.age) return;
//           try {
//             await axios.post(`${import.meta.env.VITE_API_BASE_URL}/puppies`, { ...form, age: Number(form.age) });
//             setForm({ name: '', breed: '', age: '', user_id: '' });
//             fetchPuppies();
//           } catch {
//             setError('Failed to add puppy');
//           }
//         };

//         const handleUpdate = async (e) => {
//           e.preventDefault();
//           try {
//             await axios.put(`${import.meta.env.VITE_API_BASE_URL}/puppies/${editingId}`, { ...form, age: Number(form.age) });
//             setEditingId(null);
//             setForm({ name: '', breed: '', age: '', user_id: '' });
//             fetchPuppies();
//           } catch {
//             setError('Failed to update puppy');
//           }
//         };

//         const handleDelete = async (id) => {
//           if (!window.confirm('Are you sure you want to delete this puppy?')) return;
//           try {
//             await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/puppies/${id}`);
//             fetchPuppies();
//           } catch {
//             setError('Failed to delete puppy');
//           }
//         };
//   // Handle edit button click
//   const handleEdit = (puppy) => {
//     setEditingId(puppy.id);
//     setForm({
//       name: puppy.name,
//       breed: puppy.breed,
//       age: puppy.age,
//       user_id: puppy.user_id || ''
//     });
//   };

//   // Handle form input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm(prev => ({ ...prev, [name]: value }));
//   };

//         return (
//         <main className="puppy-main">
//           <h2 className="puppy-title">Puppies Table</h2>
//           {error && <div className="puppy-error">{error}</div>}
//           {loading ? (
//             <div>Loading...</div>
//           ) : (
//             <table className="puppy-table">
//               <thead>
//                 <tr>
//                   <th>Name</th>
//                   <th>Breed</th>
//                   <th>Age</th>
//                   <th>User ID</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {puppies.map(puppy => (
//                   <tr key={puppy.id}>
//                     <td>{puppy.name}</td>
//                     <td>{puppy.breed}</td>
//                     <td>{puppy.age}</td>
//                     <td>{puppy.user_id || ''}</td>
//                     <td>
//                       <button className="puppy-edit-btn" onClick={() => handleEdit(puppy)}>Edit</button>
//                       <button className="puppy-delete-btn" onClick={() => handleDelete(puppy.id)}>Delete</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           <h3 className="puppy-form-title">{editingId ? 'Edit Puppy' : 'Add Puppy'}</h3>
//           <form className="puppy-form" onSubmit={editingId ? handleUpdate : handleAdd}>
//             <input
//               type="text"
//               name="name"
//               placeholder="Name"
//               value={form.name}
//               onChange={handleChange}
//               required
//             />
//             <input
//               type="text"
//               name="breed"
//               placeholder="Breed"
//               value={form.breed}
//               onChange={handleChange}
//               required
//             />
//             <input
//               type="number"
//               name="age"
//               placeholder="Age"
//               value={form.age}
//               onChange={handleChange}
//               required
//             />
//             <input
//               type="text"
//               name="user_id"
//               placeholder="User ID (optional)"
//               value={form.user_id}
//               onChange={handleChange}
//             />
//             <button type="submit">{editingId ? 'Update' : 'Add'}</button>
//             {editingId && (
//               <button type="button" className="puppy-cancel-btn" onClick={() => { setEditingId(null); setForm({ name: '', breed: '', age: '', user_id: '' }); }}>Cancel</button>
//             )}
//           </form>
//         </main>
//       );
//     }

//     export default Body;
