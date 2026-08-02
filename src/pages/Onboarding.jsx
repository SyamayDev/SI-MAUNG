import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import styles from './Onboarding.module.css';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Check, ShieldCheck, Zap, Target } from 'lucide-react';

const TOTAL_STEPS = 4;

const goals = [
  { id: 'control_spending', label: 'Kontrol Pengeluaran', icon: ShieldCheck },
  { id: 'save_more', label: 'Lebih Banyak Menabung', icon: Zap },
  { id: 'track_finances', label: 'Hanya Lacak Keuangan', icon: Target },
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleNextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    // Step 1: Update user metadata in auth.users
    // This is often linked via a trigger to the public.profiles table
    const { error: userError } = await supabase.auth.updateUser({
      data: { 
        full_name: nickname,
        primary_goal: primaryGoal
      } 
    });

    if (userError) {
      console.error('Error updating user metadata:', userError);
      // You should show a toast notification here
      setLoading(false);
      return;
    }

    // Step 2: Update the onboarding status in public.profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // You should show a toast notification here
      setLoading(false);
    } else {
      await refreshProfile();
      // The ProtectedRoute will handle the redirect automatically
      // navigate('/dashboard', { replace: true });
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <img src="/images/onboarding-welcome.webp" alt="Welcome" className={styles.illustration} />
            <h1 className={styles.stepTitle}>Selamat Datang di SI MAUNG!</h1>
            <p className={styles.stepDescription}>Asisten keuangan pribadi cerdas baru Anda. Mari kita siapkan hanya dalam satu menit.</p>
            <div className={styles.stepActions}>
              <Button onClick={handleNextStep} variant="primary" size="large">Mari Mulai</Button>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <img src="/images/onboarding-name.webp" alt="Nickname" className={styles.illustration} />
            <h2 className={styles.stepTitle}>Kami harus memanggilmu apa?</h2>
            <p className={styles.stepDescription}>SI MAUNG akan menggunakan nama ini untuk menyapa dan mempersonalisasi pengalaman Anda.</p>
            <div className={styles.stepActions}>
              <Input
                placeholder="contoh: Alex"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                size="large"
              />
              <Button onClick={handleNextStep} disabled={!nickname.trim()} variant="primary" size="large">Lanjutkan</Button>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <img src="/images/onboarding-goals.webp" alt="Goals" className={styles.illustration} />
            <h2 className={styles.stepTitle}>Apa tujuan utamamu?</h2>
            <p className={styles.stepDescription}>Ini membantu kami fokus pada hal yang paling penting bagimu.</p>
            <div className={styles.goalOptions}>
              {goals.map(goal => (
                <div
                  key={goal.id}
                  className={`${styles.goalOption} ${primaryGoal === goal.id ? styles.selected : ''}`}
                  onClick={() => setPrimaryGoal(goal.id)}
                >
                  <div className={styles.goalIcon}><goal.icon size={20} /></div>
                  <div className={styles.goalInfo}><h4>{goal.label}</h4></div>
                  {primaryGoal === goal.id && <Check size={20} className={styles.checkIcon} />}
                </div>
              ))}
            </div>
            <div className={styles.stepActions}>
              <Button onClick={handleNextStep} disabled={!primaryGoal} variant="primary" size="large">Lanjutkan</Button>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <img src="/images/onboarding-finish.webp" alt="All Set" className={styles.illustration} />
            <h2 className={styles.stepTitle}>Kamu sudah siap, {nickname}!</h2>
            <p className={styles.stepDescription}>Anda siap untuk mulai mengendalikan keuangan Anda dengan kekuatan AI dan suara.</p>
            <div className={styles.stepActions}>
              <Button onClick={handleFinish} loading={loading} variant="primary" size="large">
                {loading ? 'Membawamu ke aplikasi...' : 'Menuju Dasbor'}
              </Button>
            </div>
          </>
        );
      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className={styles.onboardingContainer}>
      <Card className={styles.onboardingCard}>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
        </div>
        <div className={styles.stepContent}>
          {renderStep()}
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
