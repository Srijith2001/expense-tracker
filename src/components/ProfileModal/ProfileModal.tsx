import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import { appId, db, saveUserProfile } from "../../config/firebase";
import { formatToINRText } from "../../utils/helper";
import './ProfileModal.css';

interface ProfileModalProps {
    userId: string;
    onClose: (profile: { name: string; initialBalance: number }) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ userId, onClose }) => {
    const [name, setName] = useState("");
    const [initialBalance, setInitialBalance] = useState(0);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name) return alert("Name is required");
        setSaving(true);
        try {
            await saveUserProfile(userId, name, initialBalance);

            if (initialBalance > 0) {
                const description = `Initial Balance - (+₹${initialBalance})`

                // Create a balance transaction
                const balancesCol = collection(db, 'artifacts', appId, 'users', userId, 'balances');
                await addDoc(balancesCol, {
                    description,
                    amount: initialBalance,
                    date: new Date().toISOString().slice(0, 10),
                    runningBalance: initialBalance,
                    type: 'balance',
                    createdAt: serverTimestamp()
                });
            }

            onClose({ name, initialBalance });
        } catch (err) {
            console.error(err);
            alert("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <h2 className="modal-title">Welcome! Set up your profile</h2>
                <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                        className="form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Current Balance</label>
                    <input
                        type="number"
                        className="form-input"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                    />
                    {initialBalance > 0 && (
                        <p className="balance-text">{formatToINRText(initialBalance)}</p>
                    )}
                </div>
                <button
                    className="button-save"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save Profile"}
                </button>
            </div>
        </div>
    );
};

export default ProfileModal;
