import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import type { EmergencyContact } from '../context/DemoContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/Primitives';
import { User, Phone, Heart, Clock, Edit2, PhoneCall } from 'lucide-react';

export const ElderProfile: React.FC = () => {
  const { elderProfile, updateProfile, updateContacts, startCall } = useDemo();

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
      <PageHeader
        icon={<User className="text-primary-400" size={20} />}
        title="Elder Profile"
        description="Manage senior profile details, emergency escalation configurations, and daily baseline settings."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Personal Details Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="text-xl">{elderProfile.name}'s Personal Profile</CardTitle>
              <CardDescription>Configure basic demographic data and routine expectations</CardDescription>
            </div>
            {saveSuccess && (
              <Badge variant="success" className="px-3 py-1 font-semibold animate-pulse">
                ✓ Saved Profile
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Profile Details Inputs */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-navy-200 mb-1.5">
                    Elder's Name
                  </label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy-200 mb-1.5">
                    Elder's Age
                  </label>
                  <input 
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                  />
                </div>
              </div>

              {/* Routine Baselines Header */}
              <div className="border-t border-navy-800 pt-5 space-y-4">
                <h4 className="text-sm font-semibold text-navy-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={15} /> Routine Expectations & Benchmarks
                </h4>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-400 mb-1.5 uppercase tracking-wide">
                      Expected Wake Up
                    </label>
                    <input 
                      type="text"
                      required
                      value={wakeUpTime}
                      onChange={(e) => setWakeUpTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy-400 mb-1.5 uppercase tracking-wide">
                      Expected Bed Time
                    </label>
                    <input 
                      type="text"
                      required
                      value={bedTime}
                      onChange={(e) => setBedTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy-400 mb-1.5 uppercase tracking-wide">
                      Morning Meds Window
                    </label>
                    <input 
                      type="text"
                      required
                      value={medsWindow}
                      onChange={(e) => setMedsWindow(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="border-t border-navy-800 pt-5 space-y-3">
                <h4 className="text-sm font-semibold text-navy-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart size={15} /> Important Clinical Details
                </h4>
                <div className="p-4 bg-navy-950/60 border border-navy-800 rounded-lg space-y-2 text-sm leading-relaxed text-navy-300">
                  <p><strong>Primary Diagnoses:</strong> Hypertension (Blood Pressure management), Osteoarthritic knee pain.</p>
                  <p><strong>Mobility Status:</strong> Walks independently; uses a walking cane occasionally when outdoors.</p>
                  <p><strong>Allergies:</strong> Penicillin.</p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold transition-colors"
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
                  className="p-4 bg-navy-950/60 border border-navy-800 rounded-lg relative"
                >
                  {isEditingContact ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-navy-400 mb-1">Name</label>
                        <input
                          type="text"
                          value={cName}
                          onChange={(e) => setCName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-navy-700 bg-navy-900 text-white text-xs rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-navy-400 mb-1">Relationship</label>
                        <input
                          type="text"
                          value={cRelation}
                          onChange={(e) => setCRelation(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-navy-700 bg-navy-900 text-white text-xs rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-navy-400 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={cPhone}
                          onChange={(e) => setCPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-navy-700 bg-navy-900 text-white text-xs font-mono rounded"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-navy-800">
                        <button
                          onClick={() => setEditContactId(null)}
                          className="px-2.5 py-1 text-navy-400 hover:bg-navy-800 text-xs font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveContact(contact.id)}
                          className="px-3 py-1 bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white text-sm">
                            {contact.name}
                          </h4>
                          <span className="text-[10px] text-primary-400 font-semibold uppercase tracking-wide block">
                            {contact.relation}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {contact.isPrimary && (
                            <Badge variant="danger" className="text-[8px] font-semibold tracking-widest px-2 py-0.5">
                              PRIMARY
                            </Badge>
                          )}
                          <button
                            onClick={() => handleEditContact(contact)}
                            className="p-1 hover:bg-navy-800 rounded text-navy-500 hover:text-primary-400"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-navy-400 font-medium font-mono pt-1">
                        <Phone size={12} className="text-navy-500" />
                        {contact.phone}
                      </div>

                      {/* Real outbound call via Exotel using this contact's saved number */}
                      <button
                        onClick={() => {
                          void startCall(contact, { mode: 'real' });
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-colors"
                        aria-label={`Call ${contact.name} at ${contact.phone}`}
                        title={`Place a real outbound call to ${contact.name}`}
                      >
                        <PhoneCall size={13} aria-hidden="true" />
                        Call Contact
                      </button>
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
