import React, { useState, useEffect, useRef } from 'react';
import { useDemo } from '../context/DemoContext';
import type { Medication as MedType } from '../context/DemoContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/Primitives';
import { Pill, Plus, Edit2, Trash2, Clock, Calendar, Check } from 'lucide-react';

export const Medication: React.FC = () => {
  const { medications, addMedication, editMedication, deleteMedication, toggleMedicationStatus, playMedicineOpenSound, playMedicineConfirmSound } = useDemo();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [time, setTime] = useState('09:00 AM');
  const [schedule, setSchedule] = useState('Daily');

  const hasPlayedOpenRef = useRef(false);

  // Play sound when page is first opened (mount)
  useEffect(() => {
    if (!hasPlayedOpenRef.current) {
      hasPlayedOpenRef.current = true;
      playMedicineOpenSound();
    }
  }, [playMedicineOpenSound]);

  const handleOpenAdd = () => {
    setName('');
    setTime('09:00 AM');
    setSchedule('Daily');
    setIsEditing(false);
    setSelectedMedId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (med: MedType) => {
    setName(med.name);
    setTime(med.time);
    setSchedule(med.schedule);
    setIsEditing(true);
    setSelectedMedId(med.id);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && selectedMedId) {
      editMedication(selectedMedId, { name, time, schedule });
    } else {
      addMedication({ name, time, schedule });
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this medication schedule?')) {
      deleteMedication(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <PageHeader
        icon={<Pill className="text-primary-500" size={28} />}
        title="Medication Schedule"
        description="Configure medicine logs and trigger adherence thresholds."
        actions={
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={16} /> Add Medication
          </button>
        }
      />

      {/* Medication Log list */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medications.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 bg-navy-900 border border-navy-800 rounded-xl">
            <Pill className="text-navy-600 mx-auto" size={40} />
            <h3 className="text-base font-semibold text-navy-200 mt-4">No Medications</h3>
            <p className="text-navy-500 text-sm mt-1">Add medications to begin logging and safety tracking.</p>
          </div>
        ) : (
          medications.map((med) => {
            const isTaken = med.status === 'Taken';
            const isMissed = med.status === 'Missed';

            return (
              <Card 
                key={med.id} 
                className={`flex flex-col justify-between transition-colors ${
                  isTaken 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : isMissed 
                    ? 'border-rose-500/30 bg-rose-500/5' 
                    : 'border-navy-800'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="space-y-1 w-full">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-sm font-semibold text-white leading-tight">
                        {med.name}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => handleOpenEdit(med)}
                          className="p-1 text-navy-500 hover:text-primary-400 hover:bg-navy-800 rounded transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(med.id)}
                          className="p-1 text-navy-500 hover:text-rose-400 hover:bg-navy-800 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-navy-500 uppercase">
                        <Clock size={12} /> {med.time}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-navy-500 uppercase">
                        <Calendar size={12} /> {med.schedule}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="mt-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-t border-navy-800 pt-4">
                    <span className="text-xs text-navy-500 font-medium">Daily status log:</span>
                    <Badge variant={isTaken ? 'success' : isMissed ? 'danger' : 'default'} className="font-semibold">
                      {isTaken ? `Taken at ${med.takenTime}` : isMissed ? 'Missed Dose' : 'Pending'}
                    </Badge>
                  </div>
                  
                  <button
                    onClick={() => {
                      const wasTaken = med.status === 'Taken';
                      toggleMedicationStatus(med.id);
                      if (!wasTaken) {
                        playMedicineConfirmSound();
                      }
                    }}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border transition-colors ${
                      isTaken
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15'
                        : isMissed
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/15'
                        : 'bg-primary-600 border-primary-600 hover:bg-primary-500 text-white'
                    }`}
                  >
                    {isTaken ? (
                      <>
                        <Check size={15} /> Undo Medication Take
                      </>
                    ) : isMissed ? (
                      'Mark Taken (Late)'
                    ) : (
                      'Confirm Medication Taken'
                    )}
                  </button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add / Edit Dialog Form */}
      <Dialog 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={isEditing ? 'Edit Medication Schedule' : 'Add New Medication'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy-200 mb-1.5">
              Medication / Drug Name
            </label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Blood Pressure Pill, Metformin"
              className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white placeholder-navy-600 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy-200 mb-1.5">
                Scheduled Time
              </label>
              <input 
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 09:00 AM"
                className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white placeholder-navy-600 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-200 mb-1.5">
                Frequency
              </label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Twice Daily">Twice Daily</option>
                <option value="As Needed">As Needed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-navy-800 pt-4 mt-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 border border-navy-700 text-navy-300 hover:bg-navy-800 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold"
            >
              {isEditing ? 'Save Changes' : 'Register Medication'}
            </button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
