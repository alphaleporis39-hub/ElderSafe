import React, { useState, useEffect, useRef } from 'react';
import { useDemo } from '../context/DemoContext';
import type { Medication as MedType } from '../context/DemoContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Badge } from '../components/ui/Badge';
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
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Pill className="text-primary-500" size={28} />
            Medication Schedule
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1 font-medium">
            Configure medicine logs and trigger adherence thresholds.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-base font-extrabold shadow-md shadow-primary-100 dark:shadow-none transition-colors"
        >
          <Plus size={18} /> Add Medication
        </button>
      </div>

      {/* Medication Log list */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medications.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-2xl">
            <Pill className="text-navy-300 mx-auto" size={48} />
            <h3 className="text-lg font-bold text-navy-800 dark:text-navy-200 mt-4">No Medications</h3>
            <p className="text-navy-500 dark:text-navy-450 text-sm mt-1">Add medications to begin logging and safety tracking.</p>
          </div>
        ) : (
          medications.map((med) => {
            const isTaken = med.status === 'Taken';
            const isMissed = med.status === 'Missed';

            return (
              <Card 
                key={med.id} 
                className={`flex flex-col justify-between transition-all ${
                  isTaken 
                    ? 'border-emerald-250 bg-emerald-50/10 dark:border-emerald-950/20' 
                    : isMissed 
                    ? 'border-rose-250 bg-rose-50/10 dark:border-rose-955/20 animate-soft-pulse' 
                    : 'border-navy-200'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="space-y-1 w-full">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-base font-extrabold text-navy-900 dark:text-white leading-tight">
                        {med.name}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => handleOpenEdit(med)}
                          className="p-1 text-navy-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-navy-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(med.id)}
                          className="p-1 text-navy-400 hover:text-rose-650 dark:hover:text-rose-455 hover:bg-navy-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-navy-500 uppercase">
                        <Clock size={12} /> {med.time}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-navy-500 uppercase">
                        <Calendar size={12} /> {med.schedule}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="mt-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-t border-navy-50 dark:border-navy-800/40 pt-4">
                    <span className="text-xs text-navy-500 font-medium">Daily status log:</span>
                    <Badge variant={isTaken ? 'success' : isMissed ? 'danger' : 'default'} className="font-bold">
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
                    className={`w-full py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 border transition-all ${
                      isTaken
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100'
                        : isMissed
                        ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-955/20 dark:border-rose-900/30 dark:text-rose-400 hover:bg-rose-100'
                        : 'bg-primary-500 border-primary-500 hover:bg-primary-600 text-white shadow-sm'
                    }`}
                  >
                    {isTaken ? (
                      <>
                        <Check size={16} className="stroke-[2.5]" /> Undo Medication Take
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
            <label className="block text-sm font-bold text-navy-700 dark:text-navy-300 mb-1.5">
              Medication / Drug Name
            </label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Blood Pressure Pill, Metformin"
              className="w-full px-4.5 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-850 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-navy-700 dark:text-navy-300 mb-1.5">
                Scheduled Time
              </label>
              <input 
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 09:00 AM"
                className="w-full px-4.5 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-850 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-navy-700 dark:text-navy-300 mb-1.5">
                Frequency
              </label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-4.5 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-855 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Twice Daily">Twice Daily</option>
                <option value="As Needed">As Needed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-navy-100 dark:border-navy-800 pt-4 mt-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800 rounded-xl text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-extrabold shadow-sm"
            >
              {isEditing ? 'Save Changes' : 'Register Medication'}
            </button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
