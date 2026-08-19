import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import type { EmergencyContact } from '../context/DemoContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { User, Phone, Heart, Clock, Edit2 } from 'lucide-react';

export const ElderProfile: React.FC = () => {
  const { elderProfile, updateProfile, updateContacts } = useDemo();

  // Profile fields state
  const [name, setName] = useState(elderProfile.name);
  const [age, setAge] = useState(elderProfile.age);
  const [wakeUpTime, setWakeUpTime] = useState(elderProfile.wakeUpTime);
  const [bedTime, setBedTime] = useState(elderProfile.bedTime);
  const [medsWindow, setMedsWindow] = useState(elderProfile.medsWindow);
  
  // Contacts state
  const [contacts, setContacts] = useState<EmergencyContact[]>(elderProfile.emergencyContacts);
  const [editContactId, setEditContactId] = useState<string | null>(null);
  
  // Contact Form Fields
  const [cName, setCName] = useState('');
  const [cRelation, setCRelation] = useState('');
  const [cPhone, setCPhone] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, age: Number(age), wakeUpTime, bedTime, medsWindow });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditContactId(contact.id);
    setCName(contact.name);
    setCRelation(contact.relation);
    setCPhone(contact.phone);
  };

  const handleSaveContact = (id: string) => {
    const updated = contacts.map(c => 
      c.id === id ? { ...c, name: cName, relation: cRelation, phone: cPhone } : c
    );
    setContacts(updated);
    updateContacts(updated);
    setEditContactId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <User className="text-primary-500" size={28} />
            Elder Profile
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1 font-medium">
            Manage senior profile details, emergency escalation configurations, and daily baseline settings.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Personal Details Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="text-xl">Mohan Sharma's Personal Profile</CardTitle>
              <CardDescription>Configure basic demographic data and routine expectations</CardDescription>
            </div>
            {saveSuccess && (
              <Badge variant="success" className="px-3 py-1 font-extrabold animate-pulse">
                ✓ Saved Profile
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Profile Details Inputs */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-navy-700 dark:text-navy-200 mb-1.5">
                    Elder's Name
                  </label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4.5 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-850 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-navy-700 dark:text-navy-200 mb-1.5">
                    Elder's Age
                  </label>
                  <input 
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-4.5 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-850 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                  />
                </div>
              </div>

              {/* Routine Baselines Header */}
              <div className="border-t border-navy-100 dark:border-navy-800 pt-5 space-y-4">
                <h4 className="text-sm font-extrabold text-navy-800 dark:text-navy-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={16} /> Routine Expectations & Benchmarks
                </h4>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy-600 dark:text-navy-300 mb-1.5 uppercase tracking-wide">
                      Expected Wake Up
                    </label>
                    <input 
                      type="text"
                      required
                      value={wakeUpTime}
                      onChange={(e) => setWakeUpTime(e.target.value)}
                      className="w-full px-4.5 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-850 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy-600 dark:text-navy-300 mb-1.5 uppercase tracking-wide">
                      Expected Bed Time
                    </label>
                    <input 
                      type="text"
                      required
                      value={bedTime}
                      onChange={(e) => setBedTime(e.target.value)}
                      className="w-full px-4.5 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-850 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy-600 dark:text-navy-300 mb-1.5 uppercase tracking-wide">
                      Morning Meds Window
                    </label>
                    <input 
                      type="text"
                      required
                      value={medsWindow}
                      onChange={(e) => setMedsWindow(e.target.value)}
                      className="w-full px-4.5 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-850 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="border-t border-navy-100 dark:border-navy-800 pt-5 space-y-3">
                <h4 className="text-sm font-extrabold text-navy-800 dark:text-navy-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart size={16} /> Important Clinical Details
                </h4>
                <div className="p-4 bg-navy-50 dark:bg-navy-850 border border-navy-200 dark:border-navy-800 rounded-xl space-y-2 text-sm leading-relaxed text-navy-700 dark:text-navy-350">
                  <p><strong>Primary Diagnoses:</strong> Hypertension (Blood Pressure management), Osteoarthritic knee pain.</p>
                  <p><strong>Mobility Status:</strong> Walks independently; uses a walking cane occasionally when outdoors.</p>
                  <p><strong>Allergies:</strong> Penicillin.</p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-base font-extrabold shadow-md shadow-primary-100 dark:shadow-none transition-colors"
                >
                  Save Profile Settings
                </button>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* Emergency Contacts Sidebar list */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-xl">Emergency Contacts</CardTitle>
              <CardDescription>Escalation contacts for critical alarms</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contacts.map((contact) => {
              const isEditingContact = editContactId === contact.id;

              return (
                <div 
                  key={contact.id} 
                  className="p-4 bg-navy-50 dark:bg-navy-850 border border-navy-105 dark:border-navy-800 rounded-2xl relative"
                >
                  {isEditingContact ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-navy-600 dark:text-navy-300 mb-1">Name</label>
                        <input
                          type="text"
                          value={cName}
                          onChange={(e) => setCName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-navy-300 dark:border-navy-700 dark:bg-navy-800 text-navy-900 dark:text-white text-xs rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-navy-600 dark:text-navy-300 mb-1">Relationship</label>
                        <input
                          type="text"
                          value={cRelation}
                          onChange={(e) => setCRelation(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-navy-300 dark:border-navy-700 dark:bg-navy-800 text-navy-900 dark:text-white text-xs rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-navy-600 dark:text-navy-300 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={cPhone}
                          onChange={(e) => setCPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-navy-300 dark:border-navy-700 dark:bg-navy-800 text-navy-900 dark:text-white text-xs font-mono rounded-lg"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-navy-200 dark:border-navy-750">
                        <button
                          onClick={() => setEditContactId(null)}
                          className="px-2.5 py-1 text-navy-550 dark:text-navy-400 hover:bg-navy-100 text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveContact(contact.id)}
                          className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-md"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-navy-900 dark:text-white text-sm">
                            {contact.name}
                          </h4>
                          <span className="text-[10px] text-primary-500 dark:text-primary-400 font-extrabold uppercase tracking-wide block">
                            {contact.relation}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {contact.isPrimary && (
                            <Badge variant="danger" className="text-[8px] font-black tracking-widest px-2 py-0.5">
                              PRIMARY
                            </Badge>
                          )}
                          <button
                            onClick={() => handleEditContact(contact)}
                            className="p-1 hover:bg-navy-200 dark:hover:bg-navy-800 rounded-md text-navy-400 hover:text-primary-500"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-navy-500 font-semibold font-mono pt-1">
                        <Phone size={12} className="text-navy-400" />
                        {contact.phone}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>

    </div>
  );
};
