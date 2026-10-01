'use client';

import { useState } from "react";
import { envConfig } from '@/lib/config';

const backendUrl = envConfig.apiUrl;

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log(backendUrl + "/auth/create");
            const res = await fetch(backendUrl + '/auth/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, name }),
            });
            const data = await res.json();
            console.log(data);
        } catch (error) {
            console.error(error);
        }
    }
    return <div className="flex min-h-screen w-full items-center justify-center bg-gray-900">
        <h1>Register</h1>
        <form onSubmit={(e) => handleSubmit(e)} className="flex flex-col items-center gap-2">
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <button type="submit">Register</button>
        </form>
    </div>
}

export default Register;