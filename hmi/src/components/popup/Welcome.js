import Modal from '../ui/Modal';
import Button from '../ui/Button'

const Welcome = (props) => {

  return (
    <Modal>
      <h3>Welcome</h3>
      <div>
        <Button
          label='Close'
          id='welcomeCloseBtn'
          onClick={props.onClose}
        />
      </div>
    </Modal>
  );
};

export default Welcome